/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useAgentStream } from "./hooks/useAgentStream";
import Workspace from "./components/Workspace";

export default function App() {
  const {
    connectionStatus,
    nodes,
    currentNode,
    streamedContent,
    activeQuery,
    error,
    isWebSearchActive,
    dbStatus,
    savedSessions,
    fetchSavedSessions,
    startResearch,
    cancelResearch,
    resetSession,
  } = useAgentStream();

  return (
    <Workspace
      connectionStatus={connectionStatus}
      nodes={nodes}
      currentNode={currentNode}
      streamedContent={streamedContent}
      activeQuery={activeQuery}
      error={error}
      isWebSearchActive={isWebSearchActive}
      dbStatus={dbStatus}
      savedSessions={savedSessions}
      fetchSavedSessions={fetchSavedSessions}
      startResearch={startResearch}
      cancelResearch={cancelResearch}
      resetSession={resetSession}
    />
  );
}
