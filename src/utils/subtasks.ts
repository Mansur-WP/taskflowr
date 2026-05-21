export interface Subtask {
  id: string;
  text: string;
  completed: boolean;
}

export function parseDescriptionAndSubtasks(rawDescription: string): {
  description: string;
  subtasks: Subtask[];
} {
  if (!rawDescription) {
    return { description: '', subtasks: [] };
  }

  const marker = '<!--SUBTASKS-->';
  const index = rawDescription.indexOf(marker);
  
  if (index === -1) {
    return { description: rawDescription, subtasks: [] };
  }

  const description = rawDescription.slice(0, index).trim();
  const subtasksJson = rawDescription.slice(index + marker.length).trim();

  try {
    const subtasks = JSON.parse(subtasksJson);
    if (Array.isArray(subtasks)) {
      return { description, subtasks };
    }
  } catch (e) {
    console.error('Failed to parse subtasks from task description', e);
  }

  return { description: rawDescription, subtasks: [] };
}

export function serializeDescriptionAndSubtasks(
  description: string,
  subtasks: Subtask[]
): string {
  const cleanDesc = (description || '').trim();
  if (!subtasks || subtasks.length === 0) {
    return cleanDesc;
  }
  return `${cleanDesc}\n\n<!--SUBTASKS-->${JSON.stringify(subtasks)}`;
}
