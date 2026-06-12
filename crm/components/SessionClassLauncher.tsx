'use client';

import { useMemo, useState } from 'react';
import { Video } from 'lucide-react';

type CurriculumTopicOption = {
  id: string;
  title: string;
};

type CurriculumLevelOption = {
  id: string;
  name: string;
  topics: CurriculumTopicOption[];
};

type SessionClassLauncherProps = {
  sessionId: string;
  role: 'coach' | 'student';
  studentName: string;
  currentLevelId: string;
  currentLevelName: string;
  currentTopicId: string;
  currentTopicTitle: string;
  levels: CurriculumLevelOption[];
};

export function SessionClassLauncher({
  sessionId,
  role,
  studentName,
  currentLevelId,
  currentLevelName,
  currentTopicId,
  currentTopicTitle,
  levels,
}: SessionClassLauncherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isChanging, setIsChanging] = useState(false);
  const [selectedLevelId, setSelectedLevelId] = useState(currentLevelId);
  const [selectedTopicId, setSelectedTopicId] = useState(currentTopicId);
  const selectedLevel = useMemo(
    () => levels.find((level) => level.id === selectedLevelId) || levels[0],
    [levels, selectedLevelId],
  );
  const selectedTopic = selectedLevel?.topics.find((topic) => topic.id === selectedTopicId) || selectedLevel?.topics[0];

  if (role === 'student') {
    return (
      <a className="primary-action" href={`/api/zoom/meeting?session=${encodeURIComponent(sessionId)}`}>
        <Video className="h-4 w-4" />
        Join Class
      </a>
    );
  }

  function changeLevel(nextLevelId: string) {
    const nextLevel = levels.find((level) => level.id === nextLevelId) || levels[0];
    setSelectedLevelId(nextLevel.id);
    setSelectedTopicId(nextLevel.topics[0]?.id || '');
  }

  return (
    <>
      <button className="primary-action" type="button" onClick={() => setIsOpen(true)}>
        <Video className="h-4 w-4" />
        Join Class
      </button>

      {isOpen ? (
        <div className="class-modal-backdrop" role="presentation" onClick={() => setIsOpen(false)}>
          <form className="class-modal" action="/api/zoom/meeting" method="post" onClick={(event) => event.stopPropagation()}>
            <input type="hidden" name="session" value={sessionId} />
            <input type="hidden" name="level_id" value={selectedLevelId} />
            <input type="hidden" name="completed_topic_id" value={selectedTopic?.id || ''} />

            <div className="class-modal-header">
              <div>
                <p>Start class</p>
                <h2>{studentName}</h2>
              </div>
              <button className="class-modal-close" type="button" onClick={() => setIsOpen(false)}>
                Close
              </button>
            </div>

            <div className="class-current-topic">
              <span>Current level</span>
              <strong>{selectedLevel?.name || currentLevelName}</strong>
              <span>Session for this class</span>
              <strong>{selectedTopic?.title || currentTopicTitle}</strong>
            </div>

            {isChanging ? (
              <div className="class-modal-fields">
                <label>
                  <span>Level</span>
                  <select value={selectedLevelId} onChange={(event) => changeLevel(event.target.value)}>
                    {levels.map((level) => (
                      <option key={level.id} value={level.id}>
                        {level.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Session</span>
                  <select value={selectedTopic?.id || ''} onChange={(event) => setSelectedTopicId(event.target.value)}>
                    {selectedLevel?.topics.map((topic, index) => (
                      <option key={topic.id} value={topic.id}>
                        {String(index + 1).padStart(2, '0')} - {topic.title}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            ) : null}

            <div className="class-modal-actions">
              <button className="secondary-action" type="button" onClick={() => setIsChanging((value) => !value)}>
                {isChanging ? 'Keep selection' : 'Change level/session'}
              </button>
              <button className="primary-action" type="submit">
                Start Class
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
