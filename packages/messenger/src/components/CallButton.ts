import { NativeElement, AnyNativeComponent } from '@sociably/core';
import { makePartSegment, PartSegment } from '@sociably/core/renderer';

/**
 * @category Props
 */
export type CallButtonProps = {
  /** Button title, 20 character limit. */
  title: string;
  /**
   * Format must have "+" prefix followed by the country code, area code and
   * local number.
   */
  number: string;
};

export function CallButton(
  node: NativeElement<CallButtonProps, AnyNativeComponent>,
  path: string
): PartSegment<{}>[] {
  const { title, number } = node.props;
  return [
    makePartSegment(node, path, {
      type: 'phone_number',
      title,
      number,
    }),
  ];
}
