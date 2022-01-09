import { makeInterface } from '../service';
import type {
  MachinatNode,
  FunctionalComponent,
  ContainerComponent,
} from '../types';

type RootComponentProps = {
  children: MachinatNode;
};

type RootComponent =
  | FunctionalComponent<RootComponentProps>
  | ContainerComponent<MachinatNode>;

const RootComponent = makeInterface<RootComponent>({
  name: 'RootComponent',
});

export default RootComponent;
