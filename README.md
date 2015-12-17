# passport-linkedin-token

[Passport](http://passportjs.org/) strategy for authenticating with [LinkedIn](https://linkedin.com/) access tokens using the OAuth 2.0 API.

This module lets you authenticate using LinkedIn in your Node.js applications.
By plugging into Passport, LinkedIn authentication can be easily and unobtrusively integrated into any application or framework that supports [Connect](http://www.senchalabs.org/connect/)-style middleware, including [Express](http://expressjs.com/).

## Installation

```shell
npm install passport-linkedin-token
```

## Usage

### Configure Strategy

The LinkedIn authentication strategy authenticates users using a LinkedIn account and OAuth 2.0 tokens.
The strategy requires a `verify` callback, which accepts these credentials and calls `next` providing a user, as well as `options` specifying a app ID and app secret.

```javascript
var GooglePlusTokenStrategy = require('passport-linkedin-token');

passport.use(new GooglePlusTokenStrategy({
    clientID: LINKEDIN_ID,
    clientSecret: LINKEDIN_SECRET,
    scope: ['r_emailaddress', 'r_basicprofile'],
    passReqToCallback: true
}, function(req, accessToken, refreshToken, profile, next) {
    User.findOrCreate({'linkedin.id': profile.id}, function(error, user) {
        return next(error, user);
    });
}));
```

### Authenticate Requests

Use `passport.authenticate()`, specifying the `linkedin-token` strategy, to authenticate requests.

For example, as route middleware in an [Express](http://expressjs.com/) application:

```javascript
app.get('/auth/linkedin', passport.authenticate('linkedin-token'));
```

Or if you are using Sails framework:

```javascript
// AuthController.js
module.exports = {
    linkedin: function(req, res) {
        passport.authenticate('linkedin-token', function(error, user, info) {
            if (error) return res.serverError(error);
            if (info) return res.unauthorized(info);
            return res.ok(user);
        })(req, res);
    }
};
```

The request to this route should include GET or POST data with the keys `oauth2_access_token` and optionally, `refresh_token` set to the credentials you receive from LinkedIn.

```
GET /auth/linkedin?oauth2_access_token=<LINKEDIN_TOKEN>
```
## License

The MIT License (MIT)

Copyright (c) 2015 Anderew Orel

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
