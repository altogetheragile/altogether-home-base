import { useParams, Navigate } from 'react-router-dom';

// Old /knowledge/:slug links now live under the ISA-O3 Knowledge Base. Send
// them to the technique route; the technique page self-corrects to the artifact
// route if the slug is an artifact.
export default function LegacyKnowledgeRedirect() {
  const { slug } = useParams();
  return <Navigate to={`/knowledge-base/techniques/${slug}`} replace />;
}
