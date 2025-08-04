import { Routes, Route } from "react-router-dom";
import DatasetDetail from "./components/DatasetDetail";
import DocumentDetail from "./components/DocumentDetail";
import ChatHistory from "./components/ChatHistory";

import HomePage from "./components/HomePage";
function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/chat-history" element={<ChatHistory />} />
      <Route path="/datasets/:datasetId" element={<DatasetDetail />} />
      <Route path="/datasets/:datasetId/documents/:documentId" element={<DocumentDetail />} />
    </Routes>
  );
}

export default App;
