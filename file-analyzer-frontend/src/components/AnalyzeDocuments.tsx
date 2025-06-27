// import { useMutation } from '@tanstack/react-query';
import { useActionState, useState } from 'react';
// import { trpc } from '../utils/trpc';

interface UploadState {
  message?: string;
  analysis?: {
    strengths: string[];
    weaknesses: string[];
    alignmentScore: number;
    alignmentSummary: string;
  };
  error?: string;
}

const AnalyzeDocument = () => {
  // const helloQueryResult = useQuery(trpc.hello.queryOptions());
  // const { data, isLoading, isError, error } = helloQueryResult;

  const [jobDescriptionFile, setJobDescriptionFile] = useState<File | null>(null);
  const [cvFile, setCvFile] = useState<File | null>(null);

  // const uploadMutation = useMutation(trpc.upload.mutationOptions());

  /**
   * TODO: Trpc based mutation
   */
  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();

  //   if (!jobDescriptionFile || !cvFile) {
  //     console.log('Error');
  //     return false;
  //   }

  //   const formData = new FormData();
  //   formData.append('jobDescription', jobDescriptionFile);
  //   formData.append('cv', cvFile);

  //   try {
  //     const result = await uploadMutation.mutateAsync(formData as any);
  //     console.log('Analysis Result:', result);
  //   } catch (error: any) {
  //     console.error('Analysis failed:', error);
  //   }
  // };

  const uploadAction = async (_prevState: UploadState, _formDataInput: FormData): Promise<UploadState> => {
    if (!jobDescriptionFile || !cvFile) {
      console.log('Error');
      return { error: 'Please select both Job Description PDF and CV file.' };
    }

    const formData = new FormData();
    formData.append('jobDescription', jobDescriptionFile);
    formData.append('cv', cvFile);

    try {
      const response = await fetch('http://localhost:3001/trpc/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        let errorData: any;
        try {
          errorData = await response.json();
        } catch (jsonError) {
          errorData = { message: response.statusText || 'Unknown server error' };
        }
        return { error: `Server error (${response.status}): ${errorData.message}` };
      }
      const result = await response.json();
      return result.result.data;
    } catch (error: any) {
      console.error('Analysis failed:', error);
      return { error: error.message || 'An unknown error occurred during upload.' }; // Return an error state
    }
  };

  const initialUploadState: UploadState = {};
  const [uploadState, formAction, isPending] = useActionState(uploadAction, initialUploadState);

  return (
    <div>
      <header>
        <h1>Document Analyzer</h1>
      </header>

      <form action={formAction}>
        <div className='form-group'>
          <label htmlFor='jobDescription'>Job Description:</label>
          <input
            type='file'
            id='jobDescription'
            name='jobDescription'
            accept='application/pdf'
            onChange={(e) => setJobDescriptionFile(e.target.files ? e.target.files[0] : null)}
          />
        </div>
        <div>
          <label htmlFor='cv'>CV:</label>
          <input
            type='file'
            id='cv'
            name='cv'
            accept='application/pdf'
            onChange={(e) => setCvFile(e.target.files ? e.target.files[0] : null)}
          />
        </div>

        <button type='submit' disabled={isPending}>
          {isPending ? 'Analyzing...' : 'Analyze Resumes'}
        </button>
      </form>

      {uploadState.analysis && (
        <div>
          <h3>Analysis Result:</h3>
          <div>{JSON.stringify(uploadState.analysis)}</div>
        </div>
      )}

      {uploadState.error && (
        <div style={{ color: 'red' }}>
          <h3>Error during analysis:</h3>
          <p>{uploadState.error}</p>
        </div>
      )}
    </div>
  );
};

export default AnalyzeDocument;
