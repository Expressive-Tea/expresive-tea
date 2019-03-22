/**
 * @todo Convert This from Mongoose to Sequelize
 * @body I take this example from mongoose implementation, we should be able to apply needed to use sequelize
 * implementation.
 */

export default abstract class Controller {
  model: any;

  async getId(req, res, next, entityId) {
    try {
      req.user = await this.model.findById(entityId);
      next();
    } catch (e) {
      next(e);
    }
  }

  async list(req, res, next) {
    try {
      const result = await this.model.findAll();
      res.success({
        data: result
      });
    } catch (e) {
      next(e);
    }
  }

  async entity(req, res) {
    res.success(req.user);
  }

  async delete(req, res, next) {
    next(new Error('Implementation pending for delete'));
  }

  async create(req, res, next) {
    try {
      const results = await this.model.create(req.body);
      res.success({
        success: results
      });
    } catch (e) {
      console.log('--=:ERROR:=--');
      console.error(e);
      next(e);
    }

  }
}
