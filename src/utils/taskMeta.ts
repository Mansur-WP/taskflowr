export interface Subtask {
  id: string;
  text: string;
  completed: boolean;
}

export interface AssignedUser {
  username: string;
  profileColor: string;
  email?: string;
}

export interface ActivityLog {
  id: string;
  text: string;
  timestamp: string; // Formatting
}

export interface TaskMetadata {
  description: string;
  subtasks: Subtask[];
  assigned: AssignedUser | null;
  activity: ActivityLog[];
}

export function parseTaskMetadata(rawText: string): TaskMetadata {
  if (!rawText) {
    return { description: '', subtasks: [], assigned: null, activity: [] };
  }

  let description = rawText;
  let subtasks: Subtask[] = [];
  let assigned: AssignedUser | null = null;
  let activity: ActivityLog[] = [];

  // Parse Subtasks
  const subtaskMarker = '<!--SUBTASKS-->';
  const subtaskIndex = rawText.indexOf(subtaskMarker);
  if (subtaskIndex !== -1) {
    const subtasksJson = rawText.substring(subtaskIndex + subtaskMarker.length);
    // Find next index of other markers to carve JSON
    const nextMarkerIndex = Math.min(
      subtasksJson.indexOf('<!--ASSIGNED-->') === -1 ? Infinity : subtasksJson.indexOf('<!--ASSIGNED-->'),
      subtasksJson.indexOf('<!--ACTIVITY-->') === -1 ? Infinity : subtasksJson.indexOf('<!--ACTIVITY-->')
    );
    const cleanedJson = nextMarkerIndex === Infinity ? subtasksJson : subtasksJson.substring(0, nextMarkerIndex);
    try {
      const parsed = JSON.parse(cleanedJson.trim());
      if (Array.isArray(parsed)) subtasks = parsed;
    } catch (e) {
      // Ignore
    }
  }

  // Parse Assigned
  const assignedMarker = '<!--ASSIGNED-->';
  const assignedIndex = rawText.indexOf(assignedMarker);
  if (assignedIndex !== -1) {
    const assignedJson = rawText.substring(assignedIndex + assignedMarker.length);
    const nextMarkerIndex = assignedJson.indexOf('<!--ACTIVITY-->');
    const cleanedJson = nextMarkerIndex === -1 ? assignedJson : assignedJson.substring(0, nextMarkerIndex);
    try {
      assigned = JSON.parse(cleanedJson.trim());
    } catch (e) {
      // Ignore
    }
  }

  // Parse Activity
  const activityMarker = '<!--ACTIVITY-->';
  const activityIndex = rawText.indexOf(activityMarker);
  if (activityIndex !== -1) {
    const activityJson = rawText.substring(activityIndex + activityMarker.length);
    try {
      const parsed = JSON.parse(activityJson.trim());
      if (Array.isArray(parsed)) activity = parsed;
    } catch (e) {
      // Ignore
    }
  }

  // Subtract all HTML comments markers for plain description text
  description = description
    .split(subtaskMarker)[0]
    .split(assignedMarker)[0]
    .split(activityMarker)[0]
    .trim();

  return { description, subtasks, assigned, activity };
}

export function serializeTaskMetadata(meta: TaskMetadata): string {
  let result = (meta.description || '').trim();
  if (meta.subtasks && meta.subtasks.length > 0) {
    result += `\n\n<!--SUBTASKS-->${JSON.stringify(meta.subtasks)}`;
  }
  if (meta.assigned) {
    result += `\n\n<!--ASSIGNED-->${JSON.stringify(meta.assigned)}`;
  }
  if (meta.activity && meta.activity.length > 0) {
    result += `\n\n<!--ACTIVITY-->${JSON.stringify(meta.activity)}`;
  }
  return result;
}

// Push to activity queue helper
export function pushActivityLog(activity: ActivityLog[], message: string): ActivityLog[] {
  const newLog: ActivityLog = {
    id: Math.random().toString(36).slice(2, 9),
    text: message,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };
  return [newLog, ...activity].slice(0, 10); // keep last 10 logs
}
