// import { useMutation } from '@tanstack/react-query';
import { useActionState, useState } from 'react';
// import { trpc } from '../utils/trpc';

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container, // For file input label
  FormControl,
  Grid,
  Input, // For file input
  InputLabel,
  List,
  ListItem,
  ListItemText,
  Typography,
} from '@mui/material';

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
    <Box sx={{ flexGrow: 1 }}>
      {/* Header */}
      <Typography variant='h6' component='div' sx={{ flexGrow: 1 }} align='center'>
        Resume Analyzer
      </Typography>

      {/* Main Content Container */}
      <Container maxWidth='md' sx={{ mt: 4, mb: 4 }}>
        {/* File Upload Form */}
        <Box component='form' action={formAction} sx={{ p: 3, border: '1px solid #ccc', borderRadius: 2 }}>
          <Typography variant='h5' component='h2' gutterBottom align='center'>
            Upload PDFs for Analysis
          </Typography>

          <Grid container spacing={3} alignItems='center'>
            {/* Job Description File Input */}
            <Grid>
              <FormControl fullWidth margin='normal'>
                <InputLabel shrink htmlFor='jobDescription'>
                  Job Description PDF
                </InputLabel>
                <Input
                  id='jobDescription'
                  name='jobDescription'
                  type='file'
                  inputProps={{ accept: 'application/pdf' }}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setJobDescriptionFile(e.target.files ? e.target.files[0] : null)
                  }
                  required
                />
              </FormControl>
            </Grid>

            {/* CV File Input */}
            <Grid>
              <FormControl fullWidth margin='normal'>
                <InputLabel shrink htmlFor='cv'>
                  Candidate CV PDF
                </InputLabel>
                <Input
                  id='cv'
                  name='cv'
                  type='file'
                  inputProps={{ accept: 'application/pdf' }}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCvFile(e.target.files ? e.target.files[0] : null)
                  }
                  required
                />
              </FormControl>
            </Grid>

            {/* Error Messages */}
            {uploadState.error && (
              <Grid>
                <Alert severity='error'>{uploadState.error}</Alert>
              </Grid>
            )}

            {/* Submit Button */}
            <Grid>
              <Button type='submit' variant='contained' color='primary' fullWidth disabled={isPending} sx={{ mt: 2 }}>
                {isPending ? <CircularProgress size={24} color='inherit' /> : 'Submit'}
              </Button>
            </Grid>
          </Grid>
        </Box>

        {/* Analysis Results Display */}
        {uploadState.message && !uploadState.error && (
          <Card sx={{ mt: 4 }}>
            <CardContent>
              <Typography variant='h5' component='h3' gutterBottom>
                Analysis Result ({uploadState.analysis?.alignmentScore} /100):
              </Typography>

              {uploadState.analysis && (
                <Box>
                  <Typography variant='body2' sx={{ mb: 2 }}>
                    {uploadState.analysis.alignmentSummary}
                  </Typography>

                  <Typography variant='h6'>Strengths:</Typography>
                  <List dense>
                    {uploadState.analysis.strengths.map((s, i) => (
                      <ListItem key={i}>
                        <ListItemText primary={s} />
                      </ListItem>
                    ))}
                  </List>

                  <Typography variant='h6' sx={{ mt: 2 }}>
                    Weaknesses:
                  </Typography>
                  <List dense>
                    {uploadState.analysis.weaknesses.map((w, i) => (
                      <ListItem key={i}>
                        <ListItemText primary={w} />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </CardContent>
          </Card>
        )}
      </Container>
    </Box>
  );
};

export default AnalyzeDocument;
