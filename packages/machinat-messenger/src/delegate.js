import { MESSENGER_NAITVE_TYPE } from './symbol';

const isNativeComponent = component =>
  !!component && component.type.$$native === MESSENGER_NAITVE_TYPE;

const renderGeneralElement = (element, render, context, path) => {};

const renderNativeElement = (element, render, context, path) => {};

const handleRenderedResult = () => {};
