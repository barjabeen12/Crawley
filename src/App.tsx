
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";


const queryClient = new QueryClient();

const AuthenticatedApp = () => {
 


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
      Hello world
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
   
 
      
        <AuthenticatedApp />


  </QueryClientProvider>
);

export default App;
