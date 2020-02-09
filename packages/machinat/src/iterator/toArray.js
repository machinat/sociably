// @flow
import type { MachinatNode } from '../types';
import map from './map';

const identity: any = x => x;

const toArray = (children: MachinatNode) =>
  map<MachinatNode, void>(children, identity, '');

export default toArray;
