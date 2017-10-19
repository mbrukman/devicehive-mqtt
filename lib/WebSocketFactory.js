const EventEmitter = require(`events`);
const WebSocket = require(`./WebSocket.js`);

/**
 * WebSocket Factory. For supporting multiple users
 * @event globalMessage
 */
class WebSocketFactory extends EventEmitter {

    /**
     * Create WebSocketFactory
     * @param serverUrl {String}
     */
    constructor(serverUrl) {
        super();

        this.socketMap = new Map();
        this.url = serverUrl;
    }

    /**
     * Get WebSocket by key or create new WebSocket
     * @param key
     * @returns {Promise}
     */
    getSocket(key) {
        const me = this;

        if (me.socketMap.has(key)) {
            const socket = me.socketMap.get(key);

            socket.lock();

            return Promise.resolve(socket).then(() => {
                socket.unlock();

                return socket;
            });
        } else {
            const socket = new WebSocket(me.url);

            socket.lock();
            socket.addEventListener(`message`, (message) => {
                me.emit(`globalMessage`, message, key);
            });

            me.socketMap.set(key, socket);

            return new Promise((resolve) => {
                socket.addEventListener(`open`, () => {
                    resolve(socket);
                });
            }).then(() => {
                socket.unlock();

                return socket;
            });
        }
    }

    /**
     * Remove WebSocket by key
     * @param key
     */
    removeSocket(key) {
        const me = this;

        return new Promise((resole, reject) => {
            if (me.socketMap.has(key)) {
                me.socketMap.get(key)
                    .close()
                    .then(() => {
                        me.socketMap.delete(key);
                        resole();
                    })
                    .catch(reject)
            } else {
                resole();
            }
        });
    }

    /**
     * Remove Check for socket with such key
     * @param key
     */
    hasSocket(key) {
        const me = this;

        return me.socketMap.has(key);
    }

}

module.exports = WebSocketFactory;