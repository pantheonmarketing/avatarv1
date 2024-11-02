import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useRef, useEffect, useCallback } from "react";
import debounce from "lodash/debounce";

export function AvatarCreatorComponent() {
  // ... existing state ...
  const [showLoadingDialog, setShowLoadingDialog] = useState(false);

  // Add ref to track saves during generation
  const saveCounter = useRef(0);
  const generationInProgress = useRef(false);

  const saveInProgress = useRef(false);

  // Add refs to track generation state
  const isGenerating = useRef(false);
  const generatedAvatarId = useRef<string | null>(null);

  useEffect(() => {
    // Reset counter when component unmounts
    return () => {
      saveCounter.current = 0;
      generationInProgress.current = false;
    };
  }, []);

  useEffect(() => {
    if (generatedAvatar) {
      debug.log('🔄 Generated Avatar State Changed:', {
        timestamp: new Date().toISOString(),
        saveCounter: saveCounter.current,
        generationActive: generationInProgress.current,
        avatarId: generatedAvatar.id
      });
    }
  }, [generatedAvatar]);

  // Track step changes
  useEffect(() => {
    debug.log('📍 Step Changed:', {
      newStep: step,
      timestamp: new Date().toISOString(),
      saveCounter: saveCounter.current,
      generationActive: generationInProgress.current
    });
  }, [step]);

  // Create a debounced save function
  const debouncedSave = useCallback(
    debounce(async (userId: string, avatarData: any) => {
      debug.log('🔒 Debounced save executing', {
        timestamp: new Date().toISOString(),
        saveCounter: saveCounter.current
      });
      return await saveAvatar(userId, avatarData);
    }, 1000),
    []
  );

  const safeSave = async (userId: string, avatarData: any) => {
    if (saveInProgress.current) {
      debug.log('🚫 Save already in progress, skipping');
      return null;
    }

    try {
      saveInProgress.current = true;
      debug.log('🔐 Starting protected save operation');
      return await saveAvatar(userId, avatarData);
    } finally {
      saveInProgress.current = false;
      debug.log('🔓 Save lock released');
    }
  };

  const handleGenerate = async () => {
    if (!user || isGenerating.current) return;

    try {
      isGenerating.current = true;
      debug.log('🎯 Starting generation, isGenerating set to true');

      setShowLoadingDialog(true);
      setGenerating(true);
      setErrors({ targetAudience: '', helpDescription: '' });

      // Deduct credit first
      await deductCredit(user.id, 1);

      // Generate avatar
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate avatar');
      }

      const data = await response.json();
      
      // Only save if we haven't already saved this generation
      if (!generatedAvatarId.current) {
        debug.log('💾 First time save for this generation');
        
        const avatarToSave = {
          ...data,
          user_id: user.id,
          user_email: user.emailAddresses[0]?.emailAddress || '',
          targetAudience: formData.targetAudience,
          helpDescription: formData.helpDescription
        };

        const savedAvatar = await saveAvatar(user.id, avatarToSave);
        generatedAvatarId.current = savedAvatar.id;

        // Update state once
        setGeneratedAvatar({ ...avatarToSave, id: savedAvatar.id });
        setStep(2);
      } else {
        debug.log('🚫 Skipping save - avatar already saved with ID:', generatedAvatarId.current);
      }

      toast.success('Avatar generated successfully!');
    } catch (err: any) {
      debug.error('❌ Error in handleGenerate:', {
        error: err,
        component: 'AvatarCreatorComponent',
        stack: new Error().stack,
        timestamp: new Date().toISOString()
      });
      setErrors({ 
        targetAudience: err.message || 'Failed to generate avatar',
        helpDescription: ''
      });
      toast.error(err.message || 'Failed to generate avatar');
    } finally {
      setGenerating(false);
      setShowLoadingDialog(false);
      isGenerating.current = false;
      debug.log('🏁 Generation completed, isGenerating set to false');
    }
  };

  // Reset generation state when component unmounts
  useEffect(() => {
    return () => {
      isGenerating.current = false;
      generatedAvatarId.current = null;
    };
  }, []);

  // Reset generation state when form data changes
  useEffect(() => {
    generatedAvatarId.current = null;
    debug.log('🔄 Form data changed, resetting generatedAvatarId');
  }, [formData]);

  // Remove handleSaveConfirm since we're not using it anymore
  // All saves should go through handleSaveAvatar which updates existing avatars

  const handleSaveAvatar = async () => {
    if (!user?.id || !generatedAvatar?.id) {
      debug.error('❌ Invalid save attempt:', {
        function: 'handleSaveAvatar',
        userId: user?.id,
        avatarId: generatedAvatar?.id,
        timestamp: new Date().toISOString()
      });
      toast.error('No avatar to save');
      return;
    }

    try {
      debug.log('💾 UPDATE AVATAR OPERATION STARTED', {
        function: 'handleSaveAvatar',
        component: 'AvatarCreatorComponent',
        avatarId: generatedAvatar.id,
        timestamp: new Date().toISOString()
      });

      setLoading(true);
      
      const avatarToUpdate = {
        ...generatedAvatar,
        imageUrl: avatarImageUrl || null,
        imageGenerationKeywords: generatedAvatar.imageGenerationKeywords || ''
      };

      // Update the existing avatar
      await updateAvatar(generatedAvatar.id, avatarToUpdate);
      toast.success('Avatar updated successfully!');
    } catch (error) {
      debug.error('❌ Error in handleSaveAvatar:', {
        error,
        component: 'AvatarCreatorComponent',
        stack: new Error().stack,
        timestamp: new Date().toISOString()
      });
      console.error('Error updating avatar:', error);
      toast.error('Failed to update avatar');
    } finally {
      setLoading(false);
    }
  };

  // Add this near your return statement, before the main content
  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <Dialog open={showLoadingDialog} onOpenChange={setShowLoadingDialog}>
        <DialogContent className="sm:max-w-md" hideClose>
          <div className="flex flex-col items-center justify-center p-6 space-y-6">
            <div className="w-24 h-24 relative">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 animate-pulse"></div>
              <div className="absolute inset-1 rounded-full bg-white dark:bg-gray-900 flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-center bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Generating Avatar
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-center">
              Please wait while we create your perfect avatar...
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rest of your existing JSX */}
    </div>
  );
} 