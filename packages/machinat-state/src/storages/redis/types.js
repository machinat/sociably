// @flow

export type RedisStateConfigs = {
  host?: string,
  port?: number,
  path?: string,
  url?: string,
  string_numbers?: boolean,
  return_buffers?: boolean,
  detect_buffers?: boolean,
  socket_keepalive?: boolean,
  socket_initial_delay?: number,
  no_ready_check?: boolean,
  enable_offline_queue?: boolean,
  retry_unfulfilled_commands?: boolean,
  password?: string,
  db?: number,
  family?: string,
  disable_resubscribing?: boolean,
  rename_commands?: Object,
  tls?: Object,
  prefix?: string,
  retry_strategy?: Function,
};
