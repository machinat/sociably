const getObjectValueByRoutes = (
  object: unknown,
  routes: string[],
): string | null => {
  if (!object) {
    return null;
  }
  if (routes.length === 0) {
    return typeof object === 'string' ? object : String(object);
  }

  const [route, ...restRoutes] = routes;

  if (route === '*') {
    if (!Array.isArray(object)) {
      return null;
    }

    const values: string[] = [];

    for (const item of object) {
      const itemValue = getObjectValueByRoutes(item, restRoutes);
      if (itemValue === null) {
        return null;
      }
      values.push(itemValue);
    }

    return values.join(',');
  }

  if (typeof object !== 'object') {
    return null;
  }

  return getObjectValueByRoutes(
    (object as Record<string, unknown>)[route],
    restRoutes,
  );
};

const getObjectValueByPath = (object: unknown, path: string): string | null => {
  if (!object || !path.startsWith('$')) {
    return null;
  }

  return getObjectValueByRoutes(object, path.split('.').slice(1));
};

export default getObjectValueByPath;
