import { OAuth2Strategy, InternalOAuthError } from 'passport-oauth';
import _  from 'lodash';

/**
 * `Strategy` constructor.
 * The LinkedIn  authentication strategy authenticates requests by delegating to linkedin  using OAuth2 access tokens.
 * Applications must supply a `verify` callback which accepts a accessToken, refreshToken, profile and callback.
 * Callback supplying a `user`, which should be set to `false` if the credentials are not valid.
 * If an exception occurs, `error` should be set.
 *
 * Options:
 * - clientID          Identifies client to linkedin App
 * - clientSecret      Secret used to establish ownership of the consumer key
 * - scope             LinkedIn scope
 * - profileFields     LinkedIn profile fields, not included in scope (optional)
 * - passReqToCallback If need, pass req to verify callback
 *
 * @param {Object} _options
 * @param {Function} _verify
 * @constructor
 * @example
 * passport.use(new linkedinPlusTokenStrategy({
 *   clientID: '123456789',
 *   clientSecret: 'shhh-its-a-secret'
 * }), function(req, accessToken, refreshToken, profile, next) {
 *   User.findOrCreate({linkedInId: profile.id}, function(error, user) {
 *     next(error, user);
 *   });
 * });
 */
export default
class LinkedInTokenStrategy extends OAuth2Strategy {
  constructor(_options, _verify) {
    let options = _options || {};
    let verify = _verify;

    options.authorizationURL = options.authorizationURL || 'https://www.linkedin.com/uas/oauth2/authorization';
    options.tokenURL = options.tokenURL || 'https://www.linkedin.com/uas/oauth2/accessToken';
    options.scope = options.scope || ['r_basicprofile'];
    options.profileFields = options.profileFields || null;

    super(options, verify);

    this.name = 'linkedin-token';
    this._accessTokenField = options.accessTokenField || 'oauth2_access_token';
    this._refreshTokenField = options.refreshTokenField || 'refresh_token'; // never used, left for compatibility reasons
    this._profileURL = 'https://api.linkedin.com/v1/people/~:(' + this._scopeToProfileFields(options.scope, options.profileFields) + ')?format=json';
    this._passReqToCallback = options.passReqToCallback;

    this._oauth2.useAuthorizationHeaderforGET(true);
  }

  /**
   * Authenticate method
   * @param {Object} req
   * @param {Object} options
   * @returns {*}
   */
  authenticate(req, options) {
    let accessToken = (req.body && req.body[this._accessTokenField]) || (req.query && req.query[this._accessTokenField]);
    let refreshToken = (req.body && req.body[this._refreshTokenField]) || (req.query && req.query[this._refreshTokenField]);

    if (!accessToken) return this.fail({
        message: `You should provide ${this._accessTokenField}`
      }
    );

    this._loadUserProfile(accessToken,
      (error, profile) => {
        if (error) return this.error(error);

        const verified = (error, user, info) => {
          if (error) return this.error(error);
          if (!user) return this.fail(info);

          return this.success(user, info);
        };

        if (this._passReqToCallback) {
          this._verify(req, accessToken, refreshToken, profile, verified);
        } else {
          this._verify(accessToken, refreshToken, profile, verified);
        }
      });
  }

  /**
   * Parse user profile
   * @param {String} accessToken LinkedIn OAuth2 access token
   * @param {Function} done
   */
  userProfile(accessToken, done) {
    this._oauth2.get(this._profileURL, accessToken, (error, body, res) => {
        if (error) {
          try {
            let errorJSON = JSON.parse(error.data);
            return done(new InternalOAuthError(errorJSON.error.message, errorJSON.error.code));
          } catch (_) {
            return done(new InternalOAuthError('Failed to fetch user profile', error));
          }
        }

        try {
          let json = JSON.parse(body);
          let profile = {
            provider: 'linkedin',
            id: json.id,
            displayName: json.formattedName || '',
            name: {
              familyName: json.lastName || '',
              givenName: json.firstName || ''
            },
            emails: json.emailAddress ? [{value: json.emailAddress}] : [],
            photos: [{
              value: json.pictureUrl || ''
            }],
            _raw: body,
            _json: json
          };

          return done(null, profile);
        }

        catch (e) {
          return done(e);
        }
      }
    );
  }

  /**
   * Convert LinkedIn scopes to list of profile fields
   * @param {Array} scope LinkedIn scopes array
   * @param {Array} profileFields
   */
  _scopeToProfileFields(scope, profileFields) {
    let map = {
      'r_basicprofile': [
        'id',
        'first-name',
        'last-name',
        'picture-url',
        'picture-urls::(original)',
        'formatted-name',
        'maiden-name',
        'phonetic-first-name',
        'phonetic-last-name',
        'formatted-phonetic-name',
        'headline',
        'location:(name,country:(code))',
        'industry',
        'distance',
        'relation-to-viewer:(distance,connections)',
        'current-share',
        'num-connections',
        'num-connections-capped',
        'summary',
        'specialties',
        'positions',
        'site-standard-profile-request',
        'api-standard-profile-request:(headers,url)',
        'public-profile-url'
      ],
      'r_emailaddress': ['email-address'],
      'r_fullprofile': [
        'last-modified-timestamp',
        'proposal-comments',
        'associations',
        'interests',
        'publications',
        'patents',
        'languages',
        'skills',
        'certifications',
        'educations',
        'courses',
        'volunteer',
        'three-current-positions',
        'three-past-positions',
        'num-recommenders',
        'recommendations-received',
        'mfeed-rss-url',
        'following',
        'job-bookmarks',
        'suggestions',
        'date-of-birth',
        'member-url-resources:(name,url)',
        'related-profile-views',
        'honors-awards'
      ]
    };

    let fields = [];
    let scopeFields = [];

    if (Array.isArray(scope)) {
      scopeFields = scope.reduce((acc, scopeName) => {
        if (typeof map[scopeName] === 'undefined') return acc;

        if (Array.isArray(map[scopeName])) {
          return acc.concat(map[scopeName]);
        }
      }, []);
    }

    if (Array.isArray(profileFields)) {
      fields = profileFields.slice();
    }

    return _.uniq(fields.concat(scopeFields)).join(',');
  }

}


