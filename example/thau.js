(function (exports) {
    'use strict';

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */

    var __assign = function() {
        __assign = Object.assign || function __assign(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
            }
            return t;
        };
        return __assign.apply(this, arguments);
    };

    function __awaiter(thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    }

    function __generator(thisArg, body) {
        var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
        return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
        function verb(n) { return function (v) { return step([n, v]); }; }
        function step(op) {
            if (f) throw new TypeError("Generator is already executing.");
            while (_) try {
                if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
                if (y = 0, t) op = [op[0] & 2, t.value];
                switch (op[0]) {
                    case 0: case 1: t = op; break;
                    case 4: _.label++; return { value: op[1], done: false };
                    case 5: _.label++; y = op[1]; op = [0]; continue;
                    case 7: op = _.ops.pop(); _.trys.pop(); continue;
                    default:
                        if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                        if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                        if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                        if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                        if (t[2]) _.ops.pop();
                        _.trys.pop(); continue;
                }
                op = body.call(thisArg, _);
            } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
            if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
        }
    }

    var ThauError = /** @class */ (function () {
        function ThauError(message, status) {
            if (status === void 0) { status = 500; }
            this.message = message;
            this.status = status;
        }
        return ThauError;
    }());

    var generateFacebookInitScript = function (clientId, graphVersion) { return "\nwindow.fbAsyncInit = function() {\n  FB.init({\n    appId      : '" + clientId + "',\n    cookie     : true,                       // Enable cookies to allow the server to access the session.\n    version    : '" + graphVersion + "'           // Use this Graph API version for this call.\n  });\n};\n(function(d, s, id) {                        // Load the SDK asynchronously\n  var js, fjs = d.getElementsByTagName(s)[0];\n  if (d.getElementById(id)) return;\n  js = d.createElement(s); js.id = id;\n  js.src = \"https://connect.facebook.net/en_US/sdk.js\";\n  fjs.parentNode.insertBefore(js, fjs);\n}(document, 'script', 'facebook-jssdk'));\n"; };
    var initFBApi = function (clientId, graphVersion) {
        return new Promise(function (resolve, reject) {
            var script = document.createElement('script');
            script.id = 'facebookapi-loader';
            script.innerHTML = generateFacebookInitScript(clientId, graphVersion);
            document.body.appendChild(script);
            resolve();
        });
    };
    var initGoogleApi = function (clientId) {
        return new Promise(function (resolve, reject) {
            var googleScriptsDependencies = document.createElement('div');
            googleScriptsDependencies.id = 'gapi-loader';
            var googleClientscript = document.createElement('script');
            googleClientscript.src =
                'https://apis.google.com/js/client:platform.js?onload=start';
            googleClientscript.async = true;
            googleClientscript.id = 'gapi-script';
            googleScriptsDependencies.appendChild(googleClientscript);
            document.body.appendChild(googleScriptsDependencies);
            googleClientscript.addEventListener('load', function () {
                if (!gapi.auth2) {
                    gapi.load('auth2', {
                        callback: function () {
                            gapi.auth2
                                .init({
                                client_id: clientId,
                            })
                                .then(function () { return resolve(); })
                                .catch(function (e) {
                                return reject(new ThauError(e.details));
                            });
                        },
                        onerror: function (e) {
                            return reject(new ThauError(e.details));
                        },
                    });
                }
            });
        });
    };

    var ThauJS = /** @class */ (function () {
        function ThauJS(url, fetchOptions) {
            this.url = url;
            this.fetchOptions = fetchOptions;
            this.token = this.getToken();
        }
        ThauJS.prototype.init = function (searchParams) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, e_1;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _a = this;
                            return [4 /*yield*/, this.get('/configs')];
                        case 1:
                            _a.configurations = _b.sent();
                            _b.label = 2;
                        case 2:
                            _b.trys.push([2, 4, , 5]);
                            return [4 /*yield*/, this.continueLoginFlow(searchParams)];
                        case 3:
                            _b.sent();
                            return [3 /*break*/, 5];
                        case 4:
                            e_1 = _b.sent();
                            console.error(e_1);
                            return [3 /*break*/, 5];
                        case 5:
                            if (!this.isStrategySupported('facebook')) return [3 /*break*/, 7];
                            console.log('Initializing Facebook SDK...');
                            return [4 /*yield*/, initFBApi(this.configurations.facebookStrategyConfiguration.clientId, this.configurations.facebookStrategyConfiguration.graphVersion)];
                        case 6:
                            _b.sent();
                            console.log('Facebook SDK: done.');
                            _b.label = 7;
                        case 7:
                            if (!this.isStrategySupported('google')) return [3 /*break*/, 9];
                            console.log('Initializing Google SDK...');
                            return [4 /*yield*/, initGoogleApi(this.configurations.googleStrategyConfiguration.clientId)];
                        case 8:
                            _b.sent();
                            console.log('Google SDK: done.');
                            _b.label = 9;
                        case 9: return [2 /*return*/];
                    }
                });
            });
        };
        ThauJS.prototype.continueLoginFlow = function (searchParams) {
            return __awaiter(this, void 0, void 0, function () {
                var currentLoginFlow, data_1, url;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            currentLoginFlow = searchParams.get('strategy');
                            if (!(currentLoginFlow && this.isStrategySupported(currentLoginFlow))) return [3 /*break*/, 2];
                            searchParams.delete('strategy');
                            data_1 = {};
                            searchParams.forEach(function (value, key) {
                                data_1[key] = value;
                            });
                            url = new URL("" + window.location.origin + window.location.pathname);
                            history.pushState(null, null, url.toString());
                            if (currentLoginFlow === 'linkedin' && data_1.error) {
                                throw new ThauError(data_1.error_description, 401);
                            }
                            if (currentLoginFlow === 'linkedin') {
                                data_1.redirectURI = window.location.href + "?strategy=linkedin";
                            }
                            return [4 /*yield*/, this.loginWith(currentLoginFlow, data_1)];
                        case 1:
                            _a.sent();
                            _a.label = 2;
                        case 2: return [2 /*return*/];
                    }
                });
            });
        };
        ThauJS.prototype.isStrategySupported = function (strategy) {
            return this.configurations.availableStrategies.indexOf(strategy) !== -1;
        };
        ThauJS.prototype.getCurrentSession = function () {
            return __awaiter(this, void 0, void 0, function () {
                var session;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.get('/session')];
                        case 1:
                            session = _a.sent();
                            session.user.dateOfBirth = new Date(session.user.dateOfBirth);
                            return [2 /*return*/, session];
                    }
                });
            });
        };
        ThauJS.prototype.loginWithLinkedIn = function () {
            return __awaiter(this, void 0, void 0, function () {
                var linkedinURI;
                return __generator(this, function (_a) {
                    if (!this.isStrategySupported('linkedin')) {
                        throw new ThauError('LinkedIn login strategy is not supported!', 400);
                    }
                    linkedinURI = "https://www.linkedin.com/oauth/v2/authorization?";
                    linkedinURI += "response_type=code";
                    linkedinURI += "&client_id=" + this.configurations.linkedinStrategyConfiguration.clientId;
                    linkedinURI += "&redirect_uri=" + window.location.href + "?strategy=linkedin";
                    linkedinURI += "&state=" + Math.random().toString(36).substring(7);
                    linkedinURI += "&scope=r_emailaddress,r_liteprofile";
                    window.location.href = linkedinURI;
                    return [2 /*return*/];
                });
            });
        };
        ThauJS.prototype.loginWithTwitter = function () {
            return __awaiter(this, void 0, void 0, function () {
                var e_2;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, this.loginWith('twitter', {
                                    redirectURI: window.location.href + "?strategy=twitter",
                                })];
                        case 1:
                            _a.sent();
                            return [3 /*break*/, 3];
                        case 2:
                            e_2 = _a.sent();
                            if (e_2.status === 'FOUND') {
                                window.location.href = e_2.message;
                            }
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        ThauJS.prototype.loginWithGithub = function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    if (!this.isStrategySupported('github')) {
                        throw new ThauError('GitHub login strategy is not supported!', 400);
                    }
                    window.location.href = "https://github.com/login/oauth/authorize?scope=user:email&client_id=" + this.configurations.gitHubStrategyConfiguration.clientId;
                    return [2 /*return*/];
                });
            });
        };
        ThauJS.prototype.loginWithFacebook = function () {
            return __awaiter(this, void 0, void 0, function () {
                var fbUser, data, session;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!this.isStrategySupported('facebook')) {
                                throw new ThauError('Facebook login strategy is not supported!', 400);
                            }
                            return [4 /*yield*/, new Promise(function (resolve, reject) {
                                    FB.getLoginStatus(function (status) {
                                        if (status.status === 'connected') {
                                            return resolve(status.authResponse);
                                        }
                                        resolve();
                                    });
                                })];
                        case 1:
                            fbUser = _a.sent();
                            if (!!fbUser) return [3 /*break*/, 3];
                            return [4 /*yield*/, new Promise(function (resolve, reject) {
                                    FB.login(function (response) {
                                        if (response.authResponse) {
                                            return resolve(response.authResponse);
                                        }
                                        return resolve();
                                    });
                                })];
                        case 2:
                            fbUser = _a.sent();
                            _a.label = 3;
                        case 3:
                            if (!fbUser) {
                                throw new ThauError('Unauthorized', 401);
                            }
                            data = {
                                accessToken: fbUser.accessToken,
                                userID: fbUser.userID,
                            };
                            return [4 /*yield*/, this.loginWith('facebook', data)];
                        case 4:
                            _a.sent();
                            return [4 /*yield*/, this.getCurrentSession()];
                        case 5:
                            session = _a.sent();
                            return [2 /*return*/, session];
                    }
                });
            });
        };
        ThauJS.prototype.loginWithGoogle = function () {
            return __awaiter(this, void 0, void 0, function () {
                var authInstance, authResult, redirectURI, session;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!this.isStrategySupported('google')) {
                                throw new ThauError('Google login strategy is not supported!', 400);
                            }
                            authInstance = gapi.auth2.getAuthInstance();
                            return [4 /*yield*/, authInstance.grantOfflineAccess()];
                        case 1:
                            authResult = _a.sent();
                            redirectURI = window.location.href;
                            if (redirectURI.charAt(redirectURI.length - 1) === '/') {
                                redirectURI = redirectURI.slice(0, -1);
                            }
                            if (!authResult.code) return [3 /*break*/, 3];
                            return [4 /*yield*/, this.loginWith('google', {
                                    code: authResult.code,
                                    redirectURI: redirectURI,
                                })];
                        case 2:
                            _a.sent();
                            return [3 /*break*/, 4];
                        case 3: throw new ThauError(authResult.error);
                        case 4: return [4 /*yield*/, this.getCurrentSession()];
                        case 5:
                            session = _a.sent();
                            return [2 /*return*/, session];
                    }
                });
            });
        };
        ThauJS.prototype.loginWithPassword = function (email, password) {
            return __awaiter(this, void 0, void 0, function () {
                var session;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!this.isStrategySupported('password')) {
                                throw new ThauError('Password login strategy is not supported!', 400);
                            }
                            return [4 /*yield*/, this.loginWith('password', { email: email, password: password })];
                        case 1:
                            _a.sent();
                            return [4 /*yield*/, this.getCurrentSession()];
                        case 2:
                            session = _a.sent();
                            return [2 /*return*/, session];
                    }
                });
            });
        };
        ThauJS.prototype.getUserById = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.get("/users/" + id)];
                        case 1: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        ThauJS.prototype.verifyUserEmail = function (verificationCode) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.get("/users/verification?code=" + verificationCode)];
                });
            });
        };
        ThauJS.prototype.createUser = function (user, password) {
            return __awaiter(this, void 0, void 0, function () {
                var tokenDto;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.post("/users", { user: user, password: password })];
                        case 1:
                            tokenDto = _a.sent();
                            this.setToken(tokenDto.token);
                            return [4 /*yield*/, this.getCurrentSession()];
                        case 2: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        ThauJS.prototype.updateUser = function (user) {
            return __awaiter(this, void 0, void 0, function () {
                var updatedUser;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.put("/users/" + user.id, user)];
                        case 1:
                            updatedUser = _a.sent();
                            return [2 /*return*/, updatedUser];
                    }
                });
            });
        };
        ThauJS.prototype.logout = function (sessionId) {
            return __awaiter(this, void 0, void 0, function () {
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _b.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, this.delete("/session" + (sessionId ? "?sessionId=" + sessionId : ''))];
                        case 1:
                            _b.sent();
                            return [3 /*break*/, 3];
                        case 2:
                            _a = _b.sent();
                            return [3 /*break*/, 3];
                        case 3:
                            this.setToken(undefined);
                            return [2 /*return*/];
                    }
                });
            });
        };
        ThauJS.prototype.listSessions = function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.get('/session/open')];
                        case 1: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        ThauJS.prototype.getUserProviders = function (userId) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.get("/providers" + (userId ? "?userId=" + userId : ''))];
                        case 1: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        ThauJS.prototype.loginWith = function (strategy, data) {
            return __awaiter(this, void 0, void 0, function () {
                var tokenDto;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.post("/session/" + strategy, data)];
                        case 1:
                            tokenDto = _a.sent();
                            this.setToken(tokenDto.token);
                            return [2 /*return*/, tokenDto];
                    }
                });
            });
        };
        ThauJS.prototype.getHeaders = function () {
            var _a;
            var userDefinedHeaders = __assign({}, (_a = this.fetchOptions) === null || _a === void 0 ? void 0 : _a.headers);
            return __assign(__assign({}, userDefinedHeaders), { 'x-thau-jwt': this.token });
        };
        ThauJS.prototype.get = function (path) {
            return __awaiter(this, void 0, void 0, function () {
                var response, body, e_3;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 3, , 4]);
                            return [4 /*yield*/, fetch("" + this.url + path, __assign(__assign({}, this.fetchOptions), { headers: this.getHeaders() }))];
                        case 1:
                            response = _a.sent();
                            return [4 /*yield*/, response.json()];
                        case 2:
                            body = _a.sent();
                            return [3 /*break*/, 4];
                        case 3:
                            e_3 = _a.sent();
                            throw new ThauError(e_3.message);
                        case 4: return [4 /*yield*/, this.handleResponseError(response, body)];
                        case 5:
                            _a.sent();
                            return [2 /*return*/, body];
                    }
                });
            });
        };
        ThauJS.prototype.post = function (path, data) {
            return __awaiter(this, void 0, void 0, function () {
                var response, body, e_4;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 3, , 4]);
                            return [4 /*yield*/, fetch("" + this.url + path, __assign(__assign({ method: 'POST' }, this.fetchOptions), { headers: __assign({ accept: 'application/json', 'Content-Type': 'application/json' }, this.getHeaders()), body: JSON.stringify(data) }))];
                        case 1:
                            response = _a.sent();
                            return [4 /*yield*/, response.json()];
                        case 2:
                            body = _a.sent();
                            return [3 /*break*/, 4];
                        case 3:
                            e_4 = _a.sent();
                            throw new ThauError(e_4.message);
                        case 4: return [4 /*yield*/, this.handleResponseError(response, body)];
                        case 5:
                            _a.sent();
                            return [2 /*return*/, body];
                    }
                });
            });
        };
        ThauJS.prototype.put = function (path, data) {
            return __awaiter(this, void 0, void 0, function () {
                var response, body, e_5;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 3, , 4]);
                            return [4 /*yield*/, fetch("" + this.url + path, __assign(__assign({ method: 'PUT' }, this.fetchOptions), { headers: __assign({ accept: 'application/json', 'Content-Type': 'application/json' }, this.getHeaders()), body: JSON.stringify(data) }))];
                        case 1:
                            response = _a.sent();
                            return [4 /*yield*/, response.json()];
                        case 2:
                            body = _a.sent();
                            return [3 /*break*/, 4];
                        case 3:
                            e_5 = _a.sent();
                            throw new ThauError(e_5.message);
                        case 4: return [4 /*yield*/, this.handleResponseError(response, body)];
                        case 5:
                            _a.sent();
                            return [2 /*return*/, body];
                    }
                });
            });
        };
        ThauJS.prototype.delete = function (path, data) {
            return __awaiter(this, void 0, void 0, function () {
                var response, body, e_6;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 3, , 4]);
                            return [4 /*yield*/, fetch("" + this.url + path, __assign(__assign({ method: 'DELETE' }, this.fetchOptions), { headers: __assign({ accept: 'application/json', 'Content-Type': 'application/json' }, this.getHeaders()), body: data ? JSON.stringify(data) : data }))];
                        case 1:
                            response = _a.sent();
                            return [4 /*yield*/, response.json()];
                        case 2:
                            body = _a.sent();
                            return [3 /*break*/, 4];
                        case 3:
                            e_6 = _a.sent();
                            throw new ThauError(e_6.message);
                        case 4: return [4 /*yield*/, this.handleResponseError(response, body)];
                        case 5:
                            _a.sent();
                            return [2 /*return*/, body];
                    }
                });
            });
        };
        ThauJS.prototype.handleResponseError = function (response, body) {
            return __awaiter(this, void 0, void 0, function () {
                var errorMessage, errorStatus;
                return __generator(this, function (_a) {
                    if (response.status !== 200) {
                        errorMessage = '';
                        errorStatus = 500;
                        if (body.status && body.message) {
                            errorMessage = body.message;
                            errorStatus = body.status;
                        }
                        else {
                            errorMessage = response.statusText;
                            errorStatus = response.status;
                        }
                        throw new ThauError(errorMessage, errorStatus);
                    }
                    return [2 /*return*/];
                });
            });
        };
        ThauJS.prototype.getToken = function () {
            return localStorage.getItem('session_id');
        };
        ThauJS.prototype.setToken = function (token) {
            this.token = token;
            localStorage.setItem('session_id', token);
        };
        ThauJS.createClient = function (url, fetchOptions) {
            return __awaiter(this, void 0, void 0, function () {
                var client, urlSearchParams;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            client = new ThauJS(url, fetchOptions);
                            urlSearchParams = new URLSearchParams(window.location.search);
                            return [4 /*yield*/, client.init(urlSearchParams)];
                        case 1:
                            _a.sent();
                            return [2 /*return*/, client];
                    }
                });
            });
        };
        return ThauJS;
    }());
    // @ts-ignore
    window.ThauJS = ThauJS;

    exports.ThauError = ThauError;
    exports.ThauJS = ThauJS;

    return exports;

}({}));
