import { useEffect, useMemo, useState } from "react";

interface Collaborator {
  id: string;
  email: string;
  addedAt: string;
}

const STORAGE_PREFIX = "tradeform_collaborators";

interface CollaboratorsSectionProps {
  projectId?: string;
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const CollaboratorsSection: React.FC<CollaboratorsSectionProps> = ({
  projectId,
}) => {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [emailInput, setEmailInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const storageKey = useMemo(() => {
    return projectId ? `${STORAGE_PREFIX}_${projectId}` : undefined;
  }, [projectId]);

  useEffect(() => {
    if (!storageKey) return;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setCollaborators(JSON.parse(stored));
      } else {
        setCollaborators([]);
      }
    } catch (err) {
      console.error("Failed to load collaborators:", err);
    }
  }, [storageKey]);

  const persist = (items: Collaborator[]) => {
    if (!storageKey) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(items));
    } catch (err) {
      console.error("Failed to persist collaborators:", err);
    }
  };

  const handleAddCollaborator = () => {
    const trimmed = emailInput.trim();
    if (!trimmed) {
      setError("Enter an email address");
      return;
    }
    if (!emailRegex.test(trimmed)) {
      setError("Enter a valid email address");
      return;
    }
    if (
      collaborators.some(
        (collab) => collab.email.toLowerCase() === trimmed.toLowerCase()
      )
    ) {
      setError("Collaborator already added");
      return;
    }
    const entry: Collaborator = {
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${trimmed}-${Date.now()}`,
      email: trimmed,
      addedAt: new Date().toISOString(),
    };
    const updated = [entry, ...collaborators];
    setCollaborators(updated);
    persist(updated);
    setEmailInput("");
    setError(null);
  };

  return (
    <div className="card p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Collaborators</h3>
          <p className="text-sm text-gray-600">
            Add teammates by email to keep them in the loop. (Send action is
            coming soon.)
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex-1 min-w-[220px]">
            <input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="teammate@example.com"
              className="input-field w-full"
            />
          </div>
          <button
            type="button"
            onClick={handleAddCollaborator}
            className="inline-flex items-center justify-center rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-900 transition-colors"
          >
            Send Invite
          </button>
        </div>
      </div>
      {error && (
        <p className="text-sm text-red-600 mb-3" role="alert">
          {error}
        </p>
      )}
      {collaborators.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
          No collaborators yet. Use the form above to add teammates.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {collaborators.map((collaborator) => (
            <div
              key={collaborator.id}
              className="rounded-xl border border-gray-200 bg-white px-4 py-3 flex items-center gap-3 shadow-sm"
            >
              <div className="h-10 w-10 flex items-center justify-center rounded-full bg-gray-900 text-white text-sm font-semibold">
                {collaborator.email.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {collaborator.email}
                </p>
                <p className="text-xs text-gray-500">
                  Added{" "}
                  {new Date(collaborator.addedAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CollaboratorsSection;
