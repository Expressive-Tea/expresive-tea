import * as bodyParser from 'body-parser';
import * as compress from 'compression';
import * as flash from 'connect-flash';
import * as cookieParser from 'cookie-parser';
import * as cors from 'cors';
import * as express from 'express';
import * as dotEngine from 'express-dot-engine';
import * as session from 'express-session';
import * as helmet from 'helmet';
import * as methodOverride from 'method-override';
import * as morgan from 'morgan';
import * as passport from 'passport';
import * as path from 'path';

export default async function expressConfig(server) {
  server.use(
    compress({
      filter: (req, res) => /json|text|javascript|css/.test(res.getHeader('Content-Type')),
      level: 9
    })
  );

  if (process.env.NODE_ENV === 'development') {
    server.use(morgan('dev'));
    server.set('view cache', false);
  } else if (process.env.NODE_ENV === 'production') {
    server.locals.cache = 'memory';
    server.use(morgan('combined'));
  }

  server.use(session({ secret: 'S3Cr3T', resave: false, saveUninitialized: true }));
  server.set('showStackError', false);
  server.engine('dot', dotEngine.__express);
  server.set('view engine', 'dot');
  server.set('views', './views');
  server.use(cors());
  server.use(bodyParser.urlencoded({ extended: true }));
  server.use(bodyParser.json());
  server.use(methodOverride());
  server.enable('jsonp callback');
  server.use(cookieParser());
  server.use(flash());
  server.use(passport.initialize());
  server.use(passport.session());
  server.use(helmet.noCache());
  server.use(helmet.frameguard());
  server.disable('x-powered-by');
  server.use(express.static(path.resolve('./assets')));
}
