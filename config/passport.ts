
import * as passport from 'passport';

export default async function passportConfig() {
  passport.serializeUser((user: any, done) => done(null, user));
  passport.deserializeUser((id, done) => done(id));

  // Strategies
}
