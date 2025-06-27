import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './utils/trpc';
import AnalyzeDocument from './components/AnalyzeDocuments';

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AnalyzeDocument />
    </QueryClientProvider>
  );
};

export default App;
