import { ReactNode, useState, useEffect, createContext, useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import Sidebar from './sidebar';
import Header from './header';
import ContractSigningModal from '@/components/contract-signing-modal';
import { useIsMobile } from '@/hooks/use-mobile';

interface MainLayoutProps {
  children: ReactNode;
}

interface EmploymentContract {
  id: number;
  userId: number;
  status: 'pending' | 'signed' | 'expired';
  contractSigned: boolean;
}

interface MobileMenuContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  toggle: () => void;
}

export const MobileMenuContext = createContext<MobileMenuContextType>({
  isOpen: false,
  setIsOpen: () => {},
  toggle: () => {},
});

export const useMobileMenu = () => useContext(MobileMenuContext);

export default function MainLayout({ children }: MainLayoutProps) {
  const [showContractModal, setShowContractModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  // Check if user has pending contract that needs signing
  const { data: pendingContract } = useQuery<EmploymentContract>({
    queryKey: ["/api/contracts/pending"],
    retry: false,
    refetchOnWindowFocus: false,
    meta: {
      errorHandler: (error: any) => {
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

  // Close mobile menu when switching to desktop
  useEffect(() => {
    if (!isMobile) {
      setMobileMenuOpen(false);
    }
  }, [isMobile]);

  const handleContractSigned = () => {
    setShowContractModal(false);
    window.location.reload();
  };

  const mobileMenuValue = {
    isOpen: mobileMenuOpen,
    setIsOpen: setMobileMenuOpen,
    toggle: () => setMobileMenuOpen(prev => !prev),
  };

  return (
    <MobileMenuContext.Provider value={mobileMenuValue}>
      <div className="min-h-screen flex bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto w-full">
          <Header />
          <div className="custom-scrollbar">
            {children}
          </div>
        </main>
        
        <ContractSigningModal
          isOpen={showContractModal}
          onClose={() => {}}
          onSigningComplete={handleContractSigned}
        />
      </div>
    </MobileMenuContext.Provider>
  );
}
