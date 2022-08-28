const getObjectValueByRoutes = (object, routes: string[]) => {
  if (!object) {
    return null;
  }
  if (routes.length === 0) {
    return object;
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

  return getObjectValueByRoutes(object[route], restRoutes);
};

const getObjectValueByPath = (object, path: string): string | null => {
  if (!object || path[0] !== '$') {
    return null;
  }

  return getObjectValueByRoutes(object, path.split('.').slice(1));
};

export default getObjectValueByPath;
