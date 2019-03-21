// @flow
declare module 'denque' {
  declare class Denque<Element> {
    length: number;
    constructor(?(Element[])): Denque<Element>;
    push(Element): number;
    unshift(Element): number;
    pop(): void | Element;
    shift(): void | Element;
    toArray(): void | Element[];
    peekBack(): void | Element;
    peekFront(): void | Element;
    peekAt(number): void | Element;
    remove(number, number): void | Element[];
    removeOne(number): void | Element;
    splice(number, number, ...elements: Element[]): void | Element[];
    isEmpty(): boolean;
    clear(): void;
  }

  declare module.exports: typeof Denque;
}
