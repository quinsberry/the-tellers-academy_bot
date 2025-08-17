import { pino } from 'pino';

const isDebug = process.env.NODE_ENV === 'development';
export const logger = pino({
    level: 'info',
    transport: {
        targets: [
            ...(isDebug
                ? [
                      {
                          target: 'pino-pretty',
                          level: 'info',
                          options: {
                              ignore: 'pid,hostname',
                              colorize: true,
                              translateTime: true,
                          },
                      },
                  ]
                : [
                      {
                          target: 'pino/file',
                          level: 'info',
                          options: {},
                      },
                  ]),
        ],
    },
});

export type Logger = typeof logger;
