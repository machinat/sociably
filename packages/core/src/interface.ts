import { makeInterface } from './service';
import type {
  MachinatNode,
  FunctionalComponent,
  ContainerComponent,
  MachinatChannel,
} from './types';

type RootComponentProps = {
  children: MachinatNode;
};

type RootComponent =
  | FunctionalComponent<RootComponentProps>
  | ContainerComponent<MachinatNode>;

export const RootComponentI = makeInterface<RootComponent>({
  name: 'RootComponent',
});

export const RenderingChannelI = makeInterface<null | MachinatChannel>({
  name: 'RenderingChannel',
});
