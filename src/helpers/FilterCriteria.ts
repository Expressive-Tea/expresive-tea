import { MongooseQueryParser } from 'mongoose-query-parser';

const parser = new MongooseQueryParser();

export default class FilterCriteria {
  static parse(filter: any) {
    return parser.parse(filter);
  }
}
