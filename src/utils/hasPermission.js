//utils/hasPermission

export const hasPermission = (userPermissions, slug) => {
    return userPermissions.includes(slug);
};