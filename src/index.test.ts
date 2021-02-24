import argser from '.';

describe('argser', () => {
  it('should not use values for flags', () => {
    expect(
      argser(['-a=1', '-b', '2'], {
        a: false,
        b: false,
      }),
    ).toMatchInlineSnapshot(`
      Array [
        Object {
          "_": Array [
            "2",
          ],
          "a": true,
          "b": true,
        },
        null,
      ]
    `);
  });

  it('should use values for options', () => {
    expect(
      argser(['-a=1', '-b', '2'], {
        a: true,
        b: true,
      }),
    ).toMatchInlineSnapshot(`
      Array [
        Object {
          "_": Array [],
          "a": "1",
          "b": "2",
        },
        null,
      ]
    `);
  });

  it('should parse values when given a "value" function', () => {
    expect(
      argser(['-a=1', '-b', '2'], {
        a: parseInt,
        b: parseInt,
      }),
    ).toMatchInlineSnapshot(`
      Array [
        Object {
          "_": Array [],
          "a": 1,
          "b": 2,
        },
        null,
      ]
    `);
  });

  it('should output an array of values for "many" options', () => {
    expect(
      argser(['-a=1', '-b', '2'], {
        a: { value: parseInt, many: true, alias: 'b' },
      }),
    ).toMatchInlineSnapshot(`
      Array [
        Object {
          "_": Array [],
          "a": Array [
            1,
            2,
          ],
        },
        null,
      ]
    `);
  });

  it('should use process.argv.slice(2) when no arguments array is given', () => {
    process.argv = [...process.argv.slice(0, 2), '-a=1', '-b', '2'];
    expect(
      argser({
        a: true,
        b: true,
      }),
    ).toMatchInlineSnapshot(`
      Array [
        Object {
          "_": Array [],
          "a": "1",
          "b": "2",
        },
        null,
      ]
    `);
  });

  it('should return an error when an unknown option is used', () => {
    expect(
      argser(['-c'], {
        a: true,
        b: true,
      }),
    ).toMatchInlineSnapshot(`
      Array [
        Object {
          "_": Array [
            "-c",
          ],
          "a": undefined,
          "b": undefined,
        },
        [Error: Option "-c" is unknown.],
      ]
    `);
  });

  it('should stop parsing options when -- is encountered', () => {
    expect(
      argser(['-a=1', '--', '-b', '2'], {
        a: true,
        b: true,
      }),
    ).toMatchInlineSnapshot(`
      Array [
        Object {
          "_": Array [
            "-b",
            "2",
          ],
          "a": "1",
          "b": undefined,
        },
        null,
      ]
    `);
  });

  it('should not consume a -- as a value', () => {
    expect(
      argser(['-a', '--'], {
        a: true,
      }),
    ).toMatchInlineSnapshot(`
      Array [
        Object {
          "_": Array [
            "-a",
            "--",
          ],
          "a": undefined,
        },
        [Error: Option "-a" requires a value.],
      ]
    `);
  });

  it('should treat an empty option definition ({}) as a flag', () => {
    expect(
      argser(['-a=1', '-b', '2'], {
        a: {},
        b: {},
      }),
    ).toMatchInlineSnapshot(`
      Array [
        Object {
          "_": Array [
            "2",
          ],
          "a": true,
          "b": true,
        },
        null,
      ]
    `);
  });

  it('should ignore a definition for underscore (_)', () => {
    expect(
      argser(['-a=1', '-b', '2'], {
        a: false,
        b: false,
        _: false,
      }),
    ).toMatchInlineSnapshot(`
      Array [
        Object {
          "_": Array [
            "2",
          ],
          "a": true,
          "b": true,
        },
        null,
      ]
    `);
  });

  it('should return an error if an option is missing its value', () => {
    expect(
      argser(['-a'], {
        a: true,
      }),
    ).toMatchInlineSnapshot(`
      Array [
        Object {
          "_": Array [
            "-a",
          ],
          "a": undefined,
        },
        [Error: Option "-a" requires a value.],
      ]
    `);
  });

  it('should treat a single hyphen, multi-character argument as multiple single character options', () => {
    expect(
      argser(['-abc'], {
        a: false,
        b: false,
        c: false,
      }),
    ).toMatchInlineSnapshot(`
      Array [
        Object {
          "_": Array [],
          "a": true,
          "b": true,
          "c": true,
        },
        null,
      ]
    `);

    expect(
      argser(['-ab', 'foo', '-cd=bar', '-e'], {
        a: false,
        b: true,
        c: false,
        d: true,
        e: false,
      }),
    ).toMatchInlineSnapshot(`
      Array [
        Object {
          "_": Array [],
          "a": true,
          "b": "foo",
          "c": true,
          "d": "bar",
          "e": true,
        },
        null,
      ]
    `);

    expect(
      argser(['-ab', 'foo'], {
        a: true,
        b: true,
      }),
    ).toMatchInlineSnapshot(`
      Array [
        Object {
          "_": Array [
            "-a",
            "-b",
            "foo",
          ],
          "a": undefined,
          "b": undefined,
        },
        [Error: Option "-a" requires a value.],
      ]
    `);

    expect(
      argser(['-ab'], {
        a: false,
        b: true,
      }),
    ).toMatchInlineSnapshot(`
      Array [
        Object {
          "_": Array [
            "-b",
          ],
          "a": true,
          "b": undefined,
        },
        [Error: Option "-b" requires a value.],
      ]
    `);
  });
});

describe('argser.command', () => {
  it('should return the first matching command', () => {
    expect(argser.command(['a', 'b'], 'b', 'a')).toMatchInlineSnapshot(`
      Array [
        "a",
        Array [
          "b",
        ],
      ]
    `);
  });

  it('should return the first matching command from process.argv.slice(2) when no arguments array is given', () => {
    process.argv = [...process.argv.slice(0, 2), 'a', 'b'];
    expect(argser.command('b', 'a')).toMatchInlineSnapshot(`
      Array [
        "a",
        Array [
          "b",
        ],
      ]
    `);
  });

  it('should return undefined if no command is matched', () => {
    expect(argser.command(['a', 'b'], 'c', 'b')).toMatchInlineSnapshot(`
      Array [
        undefined,
        Array [
          "a",
          "b",
        ],
      ]
    `);
  });

  it('should match any argument without a dash prefix if no list of commands is given', () => {
    expect(argser.command(['a'])).toMatchInlineSnapshot(`
      Array [
        "a",
        Array [],
      ]
    `);

    expect(argser.command(['-a'])).toMatchInlineSnapshot(`
      Array [
        undefined,
        Array [
          "-a",
        ],
      ]
    `);
  });
});
