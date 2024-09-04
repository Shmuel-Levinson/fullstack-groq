import React, { createContext,useState, ReactNode } from 'react';

// Define the shape of the context value
interface GlobalStateContextType {
    isFetchingConnections: boolean;
    setIsFetchingConnections: React.Dispatch<React.SetStateAction<boolean>>;
}

// Create the context with an initial value of undefined
const GlobalStateContext = createContext<GlobalStateContextType | undefined>(undefined);

// Create a provider component with types
export const GlobalStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isFetchingConnections, setIsFetchingConnections] = useState<boolean>(false);

    return (
        <GlobalStateContext.Provider value={{ isFetchingConnections, setIsFetchingConnections }}>
    {children}
    </GlobalStateContext.Provider>
);
};
