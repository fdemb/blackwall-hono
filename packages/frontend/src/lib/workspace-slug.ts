let currentSlug: string | null = null;

export const setCurrentWorkspaceSlug = (slug: string | null) => {
  currentSlug = slug;
};

export const getCurrentWorkspaceSlug = () => currentSlug;
