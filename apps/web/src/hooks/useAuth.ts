import { useEffect, useState } from 'react';

     export const useAuth = () => {
       const [authToken, setAuthToken] = useState<string | null>(null);

       useEffect(() => {
         const token = localStorage.getItem('token');
         setAuthToken(token);
       }, []);

       return { authToken };
     };