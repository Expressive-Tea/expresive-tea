import * as _ from 'lodash';

export default async function errorHandling(server) {
  // Handle Errors
  server.use((err, req, res, next) => {
    if (_.isNil(err)) {
      next();
    }

    const statusCode = _.get(err, 'errorStatus', 500);
    res.status(statusCode).json({error: _.get(err, 'message', 'Unknown Error Message')});
  });

  // 404
  server.use((req, res) => res.status(404).json({ url: req.originalUrl, error: 'NOT FOUND' }));

}
