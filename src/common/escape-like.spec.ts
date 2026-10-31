// Unit-тест екранування для LIKE.
import { escapeLike } from './escape-like';

describe('escapeLike', () => {
  it('не чіпає звичайний текст', () => {
    expect(escapeLike('кобзар')).toBe('кобзар');
  });

  it('екранує %, _ і зворотний слеш', () => {
    expect(escapeLike('100%_a\\b')).toBe('100\\%\\_a\\\\b');
  });
});
