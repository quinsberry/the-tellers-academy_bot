import { pino, type TransportTargetOptions } from 'pino';
import { config } from '@/config';

const isDebug = process.env.NODE_ENV === 'development';

const targets: TransportTargetOptions[] = [
    // keep stdout for local/railway live view
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
];

// Mirror to Axiom (only if token present)
if (process.env.AXIOM_TOKEN && process.env.AXIOM_DATASET) {
    targets.push({
        target: '@axiomhq/pino',
        options: {
            token: config.logger.AXIOM_TOKEN,
            dataset: config.logger.AXIOM_DATASET,
        },
        level: 'info',
    });
}
export const logger = pino({
    level: 'info',
    base: { env: config.app.nodeEnv },
    transport: {
        targets,
    },
});

export type Logger = typeof logger;
