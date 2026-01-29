import ExpressiveTeaEngine from '@classes/Engine';

/**
 * Engine constructor type with static canRegister method
 */
export type EngineConstructor = typeof ExpressiveTeaEngine;

/**
 * Metadata for registered engines
 * @interface EngineMetadata
 * @since 2.0.0
 */
export interface EngineMetadata {
  /** Engine class constructor */
  engine: EngineConstructor;
  /** Unique engine name */
  name: string;
  /** Engine version (semver) */
  version: string;
  /** Initialization priority (lower runs first) */
  priority: number;
  /** Array of engine names this engine depends on */
  dependencies: string[];
}

/**
 * Engine Registry - Manages engine registration, dependency resolution, and initialization order
 * 
 * Replaces hardcoded engine arrays with an extensible plugin system that:
 * - Registers engines with metadata (name, version, priority, dependencies)
 * - Resolves engine dependencies using topological sort
 * - Detects circular dependencies
 * - Filters engines based on their `canRegister()` method
 * 
 * @example
 * ```typescript
 * // Register a custom engine
 * EngineRegistry.register({
 *   engine: MyCustomEngine,
 *   name: 'custom',
 *   version: '1.0.0',
 *   priority: 15,
 *   dependencies: ['http']
 * });
 * 
 * // Get engines in dependency order
 * const engines = EngineRegistry.getRegisteredEngines(context, settings);
 * ```
 * 
 * @class EngineRegistry
 * @since 2.0.0
 */
export default class EngineRegistry {
  private static engines: Map<string, EngineMetadata> = new Map();

  /**
   * Register an engine with metadata
   * 
   * @param {EngineMetadata} metadata - Engine metadata including name, version, priority, and dependencies
   * @throws {Error} If engine with same name is already registered
   * 
   * @example
   * ```typescript
   * EngineRegistry.register({
   *   engine: HTTPEngine,
   *   name: 'http',
   *   version: '2.0.0',
   *   priority: 0,
   *   dependencies: []
   * });
   * ```
   */
  static register(metadata: EngineMetadata): void {
    if (this.engines.has(metadata.name)) {
      throw new Error(`Engine "${metadata.name}" is already registered`);
    }
    this.engines.set(metadata.name, metadata);
  }

  /**
   * Unregister an engine by name
   * 
   * @param {string} name - Engine name to unregister
   * @returns {boolean} True if engine was unregistered, false if not found
   * 
   * @example
   * ```typescript
   * EngineRegistry.unregister('custom');
   * ```
   */
  static unregister(name: string): boolean {
    return this.engines.delete(name);
  }

  /**
   * Clear all registered engines (useful for testing)
   * 
   * @example
   * ```typescript
   * EngineRegistry.clear();
   * ```
   */
  static clear(): void {
    this.engines.clear();
  }

  /**
   * Get all registered engine metadata
   * 
   * @returns {EngineMetadata[]} Array of all registered engine metadata
   */
  static getAllEngines(): EngineMetadata[] {
    return Array.from(this.engines.values());
  }

  /**
   * Get engine metadata by name
   * 
   * @param {string} name - Engine name
   * @returns {EngineMetadata | undefined} Engine metadata or undefined if not found
   */
  static getEngine(name: string): EngineMetadata | undefined {
    return this.engines.get(name);
  }

  /**
   * Get registered engines filtered by canRegister() and sorted by dependency order
   * 
   * This method:
   * 1. Filters engines using their static `canRegister()` method
   * 2. Validates all dependencies are registered
   * 3. Detects circular dependencies
   * 4. Sorts engines using topological sort (dependencies first)
   * 5. Applies priority sorting within same dependency level
   * 
   * @param {unknown} context - Boot context to pass to canRegister()
   * @param {unknown} settings - Settings to pass to canRegister()
   * @returns {EngineConstructor[]} Array of engine constructors in initialization order
   * @throws {Error} If circular dependency is detected
   * @throws {Error} If required dependency is not registered
   * 
   * @example
   * ```typescript
   * const engines = EngineRegistry.getRegisteredEngines(boot, settings);
   * // Returns: [HTTPEngine, SocketIOEngine, TeapotEngine] in dependency order
   * ```
   */
  static getRegisteredEngines(context?: unknown, settings?: unknown): EngineConstructor[] {
    // Filter engines by canRegister()
    const availableEngines = Array.from(this.engines.values())
      .filter(metadata => metadata.engine.canRegister(context as never, settings as never));

    // Validate dependencies
    this.validateDependencies(availableEngines);

    // Detect circular dependencies
    this.detectCircularDependencies(availableEngines);

    // Topological sort with priority
    const sorted = this.topologicalSort(availableEngines);

    return sorted.map(metadata => metadata.engine);
  }

  /**
   * Validate that all dependencies are registered
   * 
   * @private
   * @param {EngineMetadata[]} engines - Engines to validate
   * @throws {Error} If a dependency is not registered
   */
  private static validateDependencies(engines: EngineMetadata[]): void {
    const engineNames = new Set(engines.map(e => e.name));

    for (const engine of engines) {
      for (const dep of engine.dependencies) {
        if (!engineNames.has(dep)) {
          throw new Error(
            `Engine "${engine.name}" depends on "${dep}" which is not registered or cannot be registered`
          );
        }
      }
    }
  }

  /**
   * Detect circular dependencies using depth-first search
   * 
   * @private
   * @param {EngineMetadata[]} engines - Engines to check
   * @throws {Error} If circular dependency is detected
   */
  private static detectCircularDependencies(engines: EngineMetadata[]): void {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const engineMap = new Map(engines.map(e => [e.name, e]));

    const visit = (engineName: string, path: string[]): void => {
      if (recursionStack.has(engineName)) {
        const cycle = [...path, engineName].join(' -> ');
        throw new Error(`Circular dependency detected: ${cycle}`);
      }

      if (visited.has(engineName)) {
        return;
      }

      visited.add(engineName);
      recursionStack.add(engineName);

      const engine = engineMap.get(engineName);
      if (engine) {
        for (const dep of engine.dependencies) {
          visit(dep, [...path, engineName]);
        }
      }

      recursionStack.delete(engineName);
    };

    for (const engine of engines) {
      if (!visited.has(engine.name)) {
        visit(engine.name, []);
      }
    }
  }

  /**
   * Topological sort with priority ordering
   * 
   * Uses Kahn's algorithm for topological sorting, with priority-based ordering
   * for engines at the same dependency level.
   * 
   * @private
   * @param {EngineMetadata[]} engines - Engines to sort
   * @returns {EngineMetadata[]} Sorted engines (dependencies first, then by priority)
   */
  private static topologicalSort(engines: EngineMetadata[]): EngineMetadata[] {
    const engineMap = new Map(engines.map(e => [e.name, e]));
    const inDegree = new Map<string, number>();
    const dependents = new Map<string, string[]>();

    // Initialize in-degree and dependents
    for (const engine of engines) {
      inDegree.set(engine.name, 0);
      dependents.set(engine.name, []);
    }

    // Build dependency graph
    for (const engine of engines) {
      for (const dep of engine.dependencies) {
        inDegree.set(engine.name, (inDegree.get(engine.name) || 0) + 1);
        dependents.get(dep)?.push(engine.name);
      }
    }

    // Priority queue for engines with no dependencies
    const queue: EngineMetadata[] = [];
    for (const engine of engines) {
      if (inDegree.get(engine.name) === 0) {
        queue.push(engine);
      }
    }

    // Sort queue by priority
    queue.sort((a, b) => a.priority - b.priority);

    const sorted: EngineMetadata[] = [];

    while (queue.length > 0) {
      // Remove engine with lowest priority
      const current = queue.shift()!;
      sorted.push(current);

      // Reduce in-degree for dependents
      const deps = dependents.get(current.name) || [];
      for (const depName of deps) {
        const newDegree = (inDegree.get(depName) || 0) - 1;
        inDegree.set(depName, newDegree);

        if (newDegree === 0) {
          const engine = engineMap.get(depName);
          if (engine) {
            // Insert sorted by priority
            const insertIndex = queue.findIndex(e => e.priority > engine.priority);
            if (insertIndex === -1) {
              queue.push(engine);
            } else {
              queue.splice(insertIndex, 0, engine);
            }
          }
        }
      }
    }

    return sorted;
  }
}
