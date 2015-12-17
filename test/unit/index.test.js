import chai, { assert } from 'chai';
import sinon from 'sinon';
import LinkedInTokenStrategy from '../../src/index';
import fakeProfile from '../fixtures/profile';

const STRATEGY_CONFIG = {
  clientID: '123',
  clientSecret: '123'
};

const BLANK_FUNCTION = () => {
};

describe('LinkedInTokenStrategy:init', () => {
  it('Should properly export Strategy constructor', () => {
    assert.isFunction(LinkedInTokenStrategy);
  });

  it('Should properly initialize', () => {
    let strategy = new LinkedInTokenStrategy(STRATEGY_CONFIG, BLANK_FUNCTION);

    assert.equal(strategy.name, 'linkedin-token');
    assert(strategy._oauth2._useAuthorizationHeaderForGET);
  });

  it('Should properly throw error on empty options', () => {
    assert.throws(() => new LinkedInTokenStrategy(), Error);
  });
});

describe('LinkedInTokenStrategy:authenticate', () => {
  describe('Authenticate without passReqToCallback', () => {
    let strategy;

    before(() => {
      strategy = new LinkedInTokenStrategy(STRATEGY_CONFIG, (accessToken, refreshToken, profile, next) => {
        assert.equal(accessToken, 'oauth2_access_token');
        assert.equal(refreshToken, 'refresh_token');
        assert.typeOf(profile, 'object');
        assert.typeOf(next, 'function');
        return next(null, profile, {info: 'foo'});
      });

      sinon.stub(strategy._oauth2, 'get', (url, accessToken, next) => next(null, fakeProfile, null));
    });

    it('Should properly parse token from body', done => {
      chai.passport.use(strategy)
        .success((user, info) => {
          assert.typeOf(user, 'object');
          assert.typeOf(info, 'object');
          assert.deepEqual(info, {info: 'foo'});
          done();
        })
        .req(req => {
          req.body = {
            oauth2_access_token: 'oauth2_access_token',
            refresh_token: 'refresh_token'
          }
        })
        .authenticate();
    });

    it('Should properly parse token from query', done => {
      chai.passport.use(strategy)
        .success((user, info) => {
          assert.typeOf(user, 'object');
          assert.typeOf(info, 'object');
          assert.deepEqual(info, {info: 'foo'});
          done();
        })
        .req(req => {
          req.query = {
            oauth2_access_token: 'oauth2_access_token',
            refresh_token: 'refresh_token'
          }
        })
        .authenticate();
    });

    it('Should properly call fail if access_token is not provided', done => {
      chai.passport.use(strategy)
        .fail(error => {
          assert.typeOf(error, 'object');
          assert.typeOf(error.message, 'string');
          assert.equal(error.message, 'You should provide oauth2_access_token');
          done();
        })
        .authenticate();
    });
  });

  describe('Authenticate with passReqToCallback', () => {
    let strategy;

    before(() => {
      strategy = new LinkedInTokenStrategy(Object.assign(STRATEGY_CONFIG, {passReqToCallback: true}), (req, accessToken, refreshToken, profile, next) => {
        assert.typeOf(req, 'object');
        assert.equal(accessToken, 'oauth2_access_token');
        assert.equal(refreshToken, 'refresh_token');
        assert.typeOf(profile, 'object');
        assert.typeOf(next, 'function');
        return next(null, profile, {info: 'foo'});
      });

      sinon.stub(strategy._oauth2, 'get', (url, accessToken, next) => next(null, fakeProfile, null));
    });

    it('Should properly call _verify with req', done => {
      chai.passport.use(strategy)
        .success((user, info) => {
          assert.typeOf(user, 'object');
          assert.typeOf(info, 'object');
          assert.deepEqual(info, {info: 'foo'});
          done();
        })
        .req(req => {
          req.body = {
            oauth2_access_token: 'oauth2_access_token',
            refresh_token: 'refresh_token'
          }
        })
        .authenticate({});
    });
  });
});

describe('LinkedInTokenStrategy:userProfile', () => {
  it('Should properly fetch profile', done => {
    let strategy = new LinkedInTokenStrategy(STRATEGY_CONFIG, BLANK_FUNCTION);

    sinon.stub(strategy._oauth2, 'get', (url, accessToken, next) => next(null, fakeProfile, null));

    strategy.userProfile('accessToken', (error, profile) => {
      if (error) return done(error);

      assert.equal(profile.provider, 'linkedin');
      assert.equal(profile.id, '3C4dtW3rtF');
      assert.equal(profile.displayName, 'Andrew Orel');
      assert.equal(profile.name.familyName, 'Orel');
      assert.equal(profile.name.givenName, 'Andrew');
      assert.deepEqual(profile.emails, [{value: 'somemail@mail.test'}]);
      assert.equal(profile.photos[0].value, 'https://media.licdn.com/mpr/mprx/0_WTL7meehtpYUJKGId_9KmIUm-0IEMzPII8ArmIoxDV0UQlkwLbz_hwYlplwNV-tFeCFlSsi');
      assert.equal(typeof profile._raw, 'string');
      assert.equal(typeof profile._json, 'object');

      done();
    });
  });

  it('Should properly handle exception on fetching profile', done => {
    let strategy = new LinkedInTokenStrategy(STRATEGY_CONFIG, BLANK_FUNCTION);

    sinon.stub(strategy._oauth2, 'get', (url, accessToken, done) => done(null, 'not a JSON', null));

    strategy.userProfile('accessToken', (error, profile) => {
      assert(error instanceof SyntaxError);
      assert.equal(typeof profile, 'undefined');
      done();
    });
  });

  it('Should properly handle wrong JSON on fetching profile', done => {
    let strategy = new LinkedInTokenStrategy(STRATEGY_CONFIG, BLANK_FUNCTION);

    sinon.stub(strategy._oauth2, 'get', (url, accessToken, done) => done(new Error('ERROR'), 'not a JSON', null));

    strategy.userProfile('accessToken', (error, profile) => {
      assert.instanceOf(error, Error);
      assert.equal(typeof profile, 'undefined');
      done();
    });
  });

  it('Should properly handle wrong JSON on fetching profile', done => {
    let strategy = new LinkedInTokenStrategy(STRATEGY_CONFIG, BLANK_FUNCTION);

    sinon.stub(strategy._oauth2, 'get', (url, accessToken, done) => done({
      data: JSON.stringify({
        error: {
          message: 'MESSAGE',
          code: 'CODE'
        }
      })
    }, 'not a JSON', null));

    strategy.userProfile('accessToken', (error, profile) => {
      assert.equal(error.message, 'MESSAGE');
      assert.equal(error.oauthError, 'CODE');
      assert.equal(typeof profile, 'undefined');
      done();
    });
  });

  it('Should properly parse profile with empty response', done => {
    let strategy = new LinkedInTokenStrategy(STRATEGY_CONFIG, BLANK_FUNCTION);

    sinon.stub(strategy._oauth2, 'get', (url, accessToken, done) => done(null, JSON.stringify({}), null));

    strategy.userProfile('accessToken', (error, profile) => {
      assert.deepEqual(profile, {
        provider: 'linkedin',
        id: undefined,
        displayName: '',
        name: {familyName: '', givenName: ''},
        emails: [],
        photos: [{value: ''}],
        _raw: '{}',
        _json: {}
      });

      done();
    });
  });
});

describe('Scopes to profile fields conversion', ()=> {
  it('Should properly convert LinkedIn scope to profile fields array', () => {
    let strategy = new LinkedInTokenStrategy(STRATEGY_CONFIG, BLANK_FUNCTION);
    let scopes = ['r_basicprofile', 'r_emailaddress'];

    assert.equal(strategy._scopeToProfileFields(scopes), [
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
      'public-profile-url',
      'email-address'
    ].join(','))
  });

  it('Should properly convert LinkedIn scope to profile fields array and add out of scope fields', () => {
    let strategy = new LinkedInTokenStrategy(STRATEGY_CONFIG, BLANK_FUNCTION);
    let scopes = ['r_basicprofile', 'r_emailaddress'];
    let fields = ['educations', 'courses'];
    assert.equal(strategy._scopeToProfileFields(scopes, fields), [
      'educations',
      'courses',
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
      'public-profile-url',
      'email-address'
    ].join(','))
  });
  it('Should properly convert LinkedIn scope to profile fields array and add out of scope fields', () => {
    let strategy = new LinkedInTokenStrategy(STRATEGY_CONFIG, BLANK_FUNCTION);
    let fields = ['educations', 'courses'];
    assert.equal(strategy._scopeToProfileFields(null, fields), [
      'educations',
      'courses'
    ].join(','))
  });
});
