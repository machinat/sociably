// @flow
import invariant from 'invariant';
import { SessionsClient } from 'dialogflow';

type DetectIntentQueryConfig = {
  languageCode?: string,
  queryParams?: Object,
};

type DialogflowMiddlewareOption = {
  projectId: string,
  authConfig?: Object,
  languageCode?: string,
  getQueryConfig?: (
    frame: EventContext<any, any, any, any, any, any, any, any, any>
  ) => Promise<DetectIntentQueryConfig>,
};

const attachDialogflowRecognitionMiddleware = (
  middlewareConf: DialogflowMiddlewareOption
): MachinatMiddleware<
  EventContext<any, any, any, any, any, any, any, any, any>,
  any
> => next => {
  invariant(
    middlewareConf && middlewareConf.projectId,
    '"projectId" of dialogflow must provided'
  );
  invariant(
    middlewareConf.languageCode || middlewareConf.getQueryConfig,
    'either one of default "languageCode" or "getQueryConfig" function must provided'
  );

  const {
    projectId,
    authConfig,
    languageCode: defaultLanguage,
    getQueryConfig,
  } = middlewareConf;

  const client = new SessionsClient(authConfig);

  return async frame => {
    const { event, channel } = frame;

    if (event.type === 'message' && event.subtype === 'text') {
      const sessionPath = client.sessionPath(projectId, channel.uid);

      let queryConfig;
      if (getQueryConfig) {
        queryConfig = await getQueryConfig(frame);
      }

      const [{ queryResult }] = await client.detectIntent({
        session: sessionPath,
        queryInput: {
          text: {
            text: event.text,
            languageCode:
              (queryConfig && queryConfig.languageCode) || defaultLanguage,
          },
        },
        queryParams: queryConfig && queryConfig.queryParams,
      });

      return next({ ...frame, recognition: queryResult });
    }

    return next(frame);
  };
};

export default attachDialogflowRecognitionMiddleware;
