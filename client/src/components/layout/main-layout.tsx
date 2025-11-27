import { ReactNode, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Sidebar from './sidebar';
import Header from './header';
import ContractSigningModal from '@/components/contract-signing-modal';

interface MainLayoutProps {
  children: ReactNode;
}

interface EmploymentContract {
  id: number;
  userId: number;
  status: 'pending' | 'signed' | 'expired';
  contractSigned: boolean;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [showContractModal, setShowContractModal] = useState(false);

  // Check if user has pending contract that needs signing
  const { data: pendingContract } = useQuery<EmploymentContract>({
    queryKey: ["/api/contracts/pending"],
    retry: false,
    refetchOnWindowFocus: false,
    meta: {
      errorHandler: (error: any) => {
        // Don't show errors for contract checking - this is expected for users without contracts
        return;
      }
    }
  });

  // Show modal if there's a pending contract
  useEffect(() => {
    if (pendingContract && pendingContract.status === 'pending' && !pendingContract.contractSigned) {
      setShowContractModal(true);
    }
  }, [pendingContract]);

  const handleContractSigned = () => {
    setShowContractModal(false);
    // Refresh the page to update user authentication state
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Header />
        <div className="custom-scrollbar">
          {children}
        </div>
      </main>
      
      {/* Contract Signing Modal */}
      <ContractSigningModal
        isOpen={showContractModal}
        onClose={() => {}} // Prevent closing - user must sign
        onSigningComplete={handleContractSigned}
      />
    </div>
  );
}
