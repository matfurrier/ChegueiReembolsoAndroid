const SERVER_URL = "http://192.168.0.104:8242/codit.afx";

class RequestError extends Error {
  constructor(message, name) {
    super(message);

    this.name = name;
  }
}

export class Http {

  constructor() {}

  get(URL, opts = {}) {

    if (opts.needAuth) {
      this._requestAuth('GET', URL, opts);
    } else {
      this._request('GET', URL, opts);
    }
  }

  put(URL, opts = {}) {

    if (opts.needAuth) {
      this._requestAuth('PUT', URL, opts);
    } else {
      this._request('PUT', URL, opts);
    }
  }

  post(URL, opts = {}) {

    if (opts.needAuth) {
      this._requestAuth('POST', URL, opts);
    } else {
      this._request('POST', URL, opts);
    }
  }

  delete() {

  }

  _request(method, URL, opts) {
    opts.params = opts.params || new Map();
    opts.useServerURL = opts.useServerURL;

    if (opts.useServerURL === undefined) {
      opts.useServerURL = true;
    }

    let xhr = new XMLHttpRequest();
    let queryParams = '?';

    if (opts.useServerURL) {
      URL = `${SERVER_URL}/ws/${URL}`;
    }

    let i = 1;
    let me = this;

    for (var [key, value] of opts.params.entries()) {
      queryParams = queryParams.concat(key).concat('=').concat(value);

      if (i < opts.params.size) {
        queryParams = queryParams.concat('&');
      }

      i++;
    }

    xhr.open(method, `${URL}${queryParams}`);

    if (opts.useServerURL) {
      xhr.setRequestHeader('Accept', 'application/json');
    }

    xhr.onreadystatechange = function(e) {

      if (this.readyState == 4) {
        let resp, err;

        switch (this.status) {
          case 200:
            resp = JSON.parse(this.responseText);

            if (resp['@error'] == 'true') {
              err = new RequestError(resp['@errorMessage'], resp['@exceptionName']);
            }
            break;
          case 404:
            err = new RequestError(`Destino não encontrado ${this.status}`, 'HTTP404');
            break;
          case 500:
            err = new RequestError(`Erro interno do servidor ${this.status}`, 'HTTP500');
            break;
          default:
            err = new RequestError(`Erro ao fazer requisição. Status ${this.status}`, 'UnrecognizedHttpStatus');
            break;
        }

        me._invokeHanlder(opts.handler, resp, err);

        if (opts.doLogoff) {
          me._requestlogoff(opts.id_session)
        }
      }
    };

    switch (method) {
      case 'POST':
        xhr.send(JSON.stringify(opts.data));
        break;
      default:
        xhr.send();
        break;
    }
  }

  _requestAuth(method, URL, opts) {
    let params = new Map();
    let authInfo = Storage.getAuthInfo();

    if (!authInfo.user || !authInfo.pass) {
      this._invokeHanlder(opts.handler, null, new RequestError('Nenhum usuário ativo encontrado para a aplicação', 'NoUser'));
    } else {
      params.set('userName', authInfo.user);
      params.set('password', authInfo.pass);

      this.get('core.sec.auth/logon', {
        params: params,
        handler: (resp, err) => {

          if (err) {
            this._invokeHanlder(opts.handler, resp, err);
          } else {
            opts.params = opts.params || new Map();

            opts.params.set('id_session', resp['@id_session']);

            opts.doLogoff = true;
            opts.id_session = opts.params.get('id_session');

            this._request(method, URL, opts);
          }
        }
      });
    }
  }

  _requestlogoff(id_session) {
    let params = new Map();
    let authInfo = Storage.getAuthInfo();

    if (id_session) {
      params.set('id_session', id_session);

      this.get('core.sec.auth/glogoff', {
        params: params
      });
    }
  }

  _invokeHanlder(handler, resp, err) {

    if (handler && typeof handler == 'function') {
      handler.call(this, resp, err);
    }
  }
}
