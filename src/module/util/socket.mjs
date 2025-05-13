import { FT } from "../system/config.mjs";

export default class CS5SocketHandler {
  constructor() {
    this.identifier = "system.fantasy-trip";
    this.registerSocketHandlers();
  }

  /**
   * Set up the system socket handlers
   */
  registerSocketHandlers() {
    console.info(FT.prefix, "Registering FT Socket Handlers");
    game.socket.on(this.identifier, ({ type, payload }) => {
      console.log("socket.on", type, payload);
      switch (type) {
        case "ACTION":
          this.#handleAction(payload);
          break;
        default:
          console.error(FT.prefix, "Unknown socket message type", type);
      }
    });
  }

  /**
   * Emits a socket message to all other clients
   * @param {String} type
   * @param {Object} payload
   */
  emit(type, payload) {
    return game.socket.emit(this.identifier, { type, payload });
  }

  #handleAction(payload) {
    console.log("handleAction()", payload);
  }
}
