# Jest Snapshot Serializer

Format Sociably JSX elements in the [jest snapshot](https://jestjs.io/docs/snapshot-testing).

## Install

```bash
npm install @sociably/jest-snapshot-serializer
# or with yarn
yarn add @sociably/jest-snapshot-serializer
```

## Setup

Add the serializer to into `jest.config.js`:

```js
module.exports = {
  // ...
  snapshotSerializers: ['@sociably/jest-snapshot-serializer'],
};
```

Or `packages.json`:

```json
{
  "name": "my-project",
  "jest": {
    "snapshotSerializers": ["@sociably/jest-snapshot-serializer"],
  }
}
```

## Example

```js
expect(
  <GenericTemplate imageAspectRatio="square" sharable>
    <GenericItem
      title="foo"
      imageUrl="http://foo.bar/image"
      buttons={<UrlButton title="check" url="http://xxx.yy.z" />}
    />
  </GenericTemplate>
).toMatchInlineSnapshot(`
  <GenericTemplate
    imageAspectRatio="square"
    sharable={true}
  >
    <GenericItem
      buttons={
        <UrlButton
          title="check"
          url="http://xxx.yy.z"
        />
      }
      imageUrl="http://foo.bar/image"
      title="foo"
    />
  </GenericTemplate>
`);
```
