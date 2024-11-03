"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "./ui/card"
import { Input } from "./ui/input"
import { Textarea } from "./ui/textarea"
import { Label } from "./ui/label"
import { Loader2, ChevronDown, Download, MoonIcon, SunIcon, Plus, Save, Trash } from "lucide-react"
import { AvatarData, AvatarDetails } from "../types/avatar"
import toast from 'react-hot-toast'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { Badge } from "@/components/ui/badge"
import { useTheme } from "next-themes"
import dynamic from 'next/dynamic'
import 'react-quill/dist/quill.snow.css'
import * as AvatarTypes from '../types/avatar';
import { truncate } from 'lodash';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useLocalStorage } from "@/hooks/useLocalStorage"
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@radix-ui/react-tabs"
import { motion } from "framer-motion"
import { Button } from "./ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import html2canvas from 'html2canvas';
import Image from 'next/image';
import { saveAvatar, getUserCredits, deductCredit, updateAvatar, deleteAvatar } from '@/services/supabaseService';
import { useUser } from '@clerk/nextjs';
import { useCredits } from '@/contexts/CreditsContext';
import { supabase } from '@/services/supabaseService';
import debounce from 'lodash/debounce';
import { debug } from '@/utils/debug';
import { uploadImageToSupabase } from '@/utils/imageUpload';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

const sectionToPropertyMap: Record<string, keyof AvatarData> = {
  "personal-details": "details",
  "story": "story",
  "current-wants": "currentWants",
  "pain-points": "painPoints",
  "desires": "desires",
  "offer-results": "offerResults",
  "biggest-problem": "biggestProblem",
  "humiliation": "humiliation",
  "frustrations": "frustrations",
  "complaints": "complaints",
  "cost-of-not-buying": "costOfNotBuying",
  "biggest-want": "biggestWant",
};

// Define the capitalizeFirstLetter function
const capitalizeFirstLetter = (string: string): string => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

// Move formatContent function before formatSectionData
const formatContent = (content: any): string => {
  if (!content) return '';

  if (typeof content === 'string') {
    return content
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/•/g, '\n• ') // Format bullet points
      .replace(/\n\s*\n/g, '\n') // Remove extra line breaks
      .trim();
  }
  if (typeof content === 'object' && content !== null) {
    if (content.name || content.career || content.age || content.location) {
      // Handle personal details object
      return Object.entries(content)
        .filter(([_, value]) => value) // Only include non-empty values
        .map(([key, value]) => `• ${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`)
        .join('\n');
    }
    return Object.entries(content)
      .filter(([_, value]) => value)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');
  }
  return '';
};

// Update formatSectionData to use the formatContent function
const formatSectionData = (data: any): string => {
  if (!data) return '';

  // Handle personal details object
  if (typeof data === 'string') {
    try {
      // Try to parse if it's a JSON string
      const parsed = JSON.parse(data);
      if (typeof parsed === 'object' && parsed !== null) {
        // If it's personal details
        if (parsed.name || parsed.age || parsed.gender || parsed.location || parsed.career) {
          return Object.entries(parsed)
            .filter(([_, value]) => value) // Filter out empty values
            .map(([key, value]) => `• ${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`)
            .join('\n');
        }
        // If it's a section with headline and points
        if (parsed.headline && Array.isArray(parsed.points)) {
          return `<h3>${parsed.headline}</h3>\n${parsed.points.map((point: string) => `• ${point}`).join('\n')}`;
        }
      }
      return formatContent(parsed);
    } catch {
      // If not valid JSON, treat as regular string
      return data
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .split('\n')
        .filter(line => line.trim())
        .map(line => line.startsWith('•') ? line : `• ${line}`)
        .join('\n');
    }
  }

  // Handle object format directly
  if (typeof data === 'object' && data !== null) {
    // If it's personal details
    if (data.name || data.age || data.gender || data.location || data.career) {
      return Object.entries(data)
        .filter(([_, value]) => value)
        .map(([key, value]) => `• ${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`)
        .join('\n');
    }
    // If it's a section with headline and points
    if (data.headline && Array.isArray(data.points)) {
      return `<h3>${data.headline}</h3>\n${data.points.map((point: string) => `• ${point}`).join('\n')}`;
    }
  }

  // Handle array format
  if (Array.isArray(data)) {
    return data.map(item => `• ${item}`).join('\n');
  }

  return String(data);
};

// Add this new component
const AnimatedAvatarPreview = () => {
  return (
    <div className="w-64 h-64 relative">
      <motion.div
        className="absolute inset-0 bg-gray-300 dark:bg-gray-700 rounded-full"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute inset-0 border-4 border-purple-500 rounded-full"
        animate={{
          rotate: 360,
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "linear",
        }}
      />
      <motion.div
        className="absolute inset-8 bg-gray-400 dark:bg-gray-600 rounded-full"
        animate={{
          scale: [1, 0.9, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute inset-16 bg-gray-500 dark:bg-gray-500 rounded-full"
        animate={{
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5,
        }}
      />
    </div>
  );
};

// Add this new component inside avatar-creator.tsx
const LoadingAnimation = () => (
  <div className="relative w-32 h-32">
    {/* Outer rotating ring */}
    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 animate-[spin_3s_linear_infinite]" />
    
    {/* Inner content */}
    <div className="absolute inset-1 rounded-full bg-white dark:bg-gray-900 flex items-center justify-center">
      {/* Multiple spinning circles */}
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 rounded-full border-4 border-purple-500 border-t-transparent animate-[spin_1s_linear_infinite]" />
        <div className="absolute inset-2 rounded-full border-4 border-pink-500 border-t-transparent animate-[spin_1.5s_linear_infinite_reverse]" />
        <div className="absolute inset-4 rounded-full border-4 border-purple-500 border-t-transparent animate-[spin_2s_linear_infinite]" />
        
        {/* Center pulsing dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 animate-pulse" />
        </div>
      </div>
    </div>
  </div>
);

// Add these interfaces at the top of the file, before the component
interface ParsedContent {
  headline?: string;
  points?: string[];
  [key: string]: any;
}

interface AvatarContent {
  headline?: string;
  points?: string[];
  [key: string]: any;
}

export function AvatarCreatorComponent() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [generatedAvatar, setGeneratedAvatar] = useState<AvatarData | null>(null)
  const [savedAvatars, setSavedAvatars] = useState<AvatarData[]>([]);
  const [currentAvatarId, setCurrentAvatarId] = useState<number | null>(null);
  const { theme, setTheme } = useTheme();
  const [editorContents, setEditorContents] = useState<Record<string, string>>({});
  const [avatarImageUrl, setAvatarImageUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState({
    targetAudience: '',
    helpDescription: ''
  });
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [avatarName, setAvatarName] = useState('');
  const { user } = useUser();
  const { credits, refreshCredits } = useCredits();
  const [generating, setGenerating] = useState(false);
  const [formData, setFormData] = useState({
    targetAudience: "",
    helpDescription: "",
  });
  const [showLoadingDialog, setShowLoadingDialog] = useState(false);
  const saveCounter = useRef(0);

  // Define the set of sections without the "Add with AI" button
  const sectionsWithoutAddWithAI = new Set(["personal-details", "offer-details"]);

  useEffect(() => {
    console.log('Generated Avatar updated:', generatedAvatar);
  }, [generatedAvatar]);

  // Create a debounced function for updating the avatar data
  const debouncedUpdateAvatar = useCallback(
    debounce((content: string, section: string) => {
      setGeneratedAvatar(prev => {
        if (!prev) return prev;
        const property = sectionToPropertyMap[section];
        return { ...prev, [property]: content };
      });
    }, 1000), // Wait 1 second after the last change before updating
    []
  );

  // Update only the editor content immediately
  const handleEditorChange = (content: string, section: string) => {
    setEditorContents(prev => ({ ...prev, [section]: content }));
    // Debounce the avatar update
    debouncedUpdateAvatar(content, section);
  };

  // Clean up the debounced function on unmount
  useEffect(() => {
    return () => {
      debouncedUpdateAvatar.cancel();
    };
  }, [debouncedUpdateAvatar]);

  // Update editor contents when avatar changes
  useEffect(() => {
    if (generatedAvatar) {
      const initialContents: Record<string, string> = {};
      Object.entries(sectionToPropertyMap).forEach(([section, property]) => {
        const sectionData = generatedAvatar[property as keyof AvatarTypes.AvatarData];
        if (sectionData && !editorContents[section]) { // Only update if content doesn't exist
          initialContents[section] = formatSectionData(sectionData);
        }
      });
      if (Object.keys(initialContents).length > 0) {
        setEditorContents(prev => ({ ...prev, ...initialContents }));
      }
    }
  }, [generatedAvatar]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = { targetAudience: '', helpDescription: '' };

    if (!formData.targetAudience.trim()) {
      newErrors.targetAudience = 'Target audience is required';
      isValid = false;
    }

    if (!formData.helpDescription.trim()) {
      newErrors.helpDescription = 'Help description is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setShowLoadingDialog(true);
      setErrors({ targetAudience: '', helpDescription: '' });

      if (!validateForm()) {
        setShowLoadingDialog(false);
        return;
      }

      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // Deduct credits first
      const deductResult = await deductCredit(user.id, 1);
      if (!deductResult) {
        throw new Error('Failed to deduct credits');
      }
      console.log('Credit deducted successfully');

      // Generate avatar
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetAudience: formData.targetAudience.trim(),
          helpDescription: formData.helpDescription.trim(),
          userId: user.id,
        }),
      }).catch(error => {
        console.error('Fetch error:', error);
        throw new Error(`Network error: ${error.message}`);
      });

      if (!response?.ok) {
        let errorMessage = 'Failed to generate avatar';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          errorMessage = `${errorMessage}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setGeneratedAvatar(data);
      
      // Generate image for the avatar
      const imageResponse = await fetch('/api/generate-avatar-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          avatarDetails: data.details
        }),
      });

      if (!imageResponse.ok) {
        throw new Error('Failed to generate image');
      }

      const imageData = await imageResponse.json();

      if (!imageData.imageUrl) {
        throw new Error('No image URL received');
      }

      // Upload the DALL-E image to Supabase storage
      const permanentImageUrl = await uploadImageToSupabase(
        imageData.imageUrl,
        `avatar-${Date.now()}`
      );
      
      // Set the avatar image URL
      setAvatarImageUrl(permanentImageUrl);
      
      // Now save the avatar with the permanent image URL
      if (user?.id) {
        try {
          const avatarToSave = {
            ...data,
            imageUrl: permanentImageUrl,  // Use the permanent URL
            user_email: user.emailAddresses?.[0]?.emailAddress,
            targetAudience: formData.targetAudience,
            helpDescription: formData.helpDescription,
          };

          await saveAvatar(user.id, avatarToSave);
          await fetchSavedAvatars();
        } catch (saveError) {
          console.error('Error saving avatar:', saveError);
          toast.error('Avatar generated but failed to save');
        }
      }

      await refreshCredits();
      // Set step to 2 after successful generation
      setStep(2);
      toast.success('Avatar generated successfully!');

    } catch (error) {
      console.error('Avatar generation error:', error);
      toast.error(error instanceof Error ? error.message : 'An unexpected error occurred');
      
      // If generation failed but credits were deducted, we should refund them
      try {
        if (user?.id) {
          await deductCredit(user.id, -1);
          console.log('Credits refunded due to generation failure');
          await refreshCredits();
        }
      } catch (refundError) {
        console.error('Failed to refund credits:', refundError);
      }
    } finally {
      setLoading(false);
      setShowLoadingDialog(false);
    }
  };

  const generateAvatarImage = async (avatarData: AvatarData) => {
    if (!avatarData || !avatarData.details) {
      console.error('Avatar details are missing');
      toast.error('Avatar details are missing. Unable to generate image.');
      return;
    }

    const toastId = toast.loading('Generating avatar image...');

    try {
      setLoading(true);

      // Generate image with DALL-E
      const response = await fetch('/api/generate-avatar-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          avatarDetails: avatarData.details
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate image');
      }

      const data = await response.json();
      
      // Upload the DALL-E image to Supabase storage
      const permanentImageUrl = await uploadImageToSupabase(
        data.imageUrl,
        avatarData.id || `temp-${Date.now()}`
      );
      
      // Save the permanent URL to state
      setAvatarImageUrl(permanentImageUrl);

      // If we have an existing avatar, update it with the new image
      if (avatarData.id && user?.id) {
        await updateAvatar(avatarData.id, {
          ...avatarData,
          imageUrl: permanentImageUrl
        });
        await fetchSavedAvatars(); // Refresh the avatars list
      }

      toast.success('Avatar image generated successfully', { id: toastId });
    } catch (error) {
      console.error('Error generating avatar image:', error);
      toast.error('Failed to generate avatar image', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const fillExampleData = () => {
    const examples = [
      {
        targetAudience: "busy professionals",
        helpDescription: "develop a side hustle while working full-time"
      },
      {
        targetAudience: "new moms",
        helpDescription: "start an online business while taking care of their baby"
      },
      {
        targetAudience: "real estate agents",
        helpDescription: "get more high-quality leads using social media"
      },
      {
        targetAudience: "fitness trainers",
        helpDescription: "create and sell online workout programs"
      },
      {
        targetAudience: "teachers",
        helpDescription: "create and sell digital educational resources"
      },
      {
        targetAudience: "food bloggers",
        helpDescription: "monetize their recipes and cooking content"
      }
    ];

    // Pick a random example
    const randomExample = examples[Math.floor(Math.random() * examples.length)];

    setFormData({
      targetAudience: randomExample.targetAudience,
      helpDescription: randomExample.helpDescription
    });
  };

  const avatarSections = [
    { id: "personal-details", title: "Personal Details", icon: "👤" },
    { id: "story", title: "Story", icon: "📖" },
    { id: "current-wants", title: "Current Wants", icon: "🎯" },
    { id: "pain-points", title: "Pain Points", icon: "😣" },
    { id: "desires", title: "Desires", icon: "✨" },
    { id: "offer-results", title: "Offer Results", icon: "🏆" },
    { id: "biggest-problem", title: "Biggest Problem", icon: "❗" },
    { id: "humiliation", title: "Humiliation", icon: "😓" },
    { id: "frustrations", title: "Frustrations", icon: "😤" },
    { id: "complaints", title: "Complaints", icon: "🗣" },
    { id: "cost-of-not-buying", title: "Cost of Not Buying", icon: "💸" },
    { id: "biggest-want", title: "Biggest Want", icon: "⭐" }, // Added icon for Biggest Want
  ];

  const renderSectionContent = (section: string) => {
    if (!generatedAvatar) return null;

    // Get the content from editorContents first
    const editorContent = editorContents[section];
    
    // If no editor content, get from generatedAvatar
    if (!editorContent) {
      const property = sectionToPropertyMap[section];
      const sectionData = generatedAvatar[property as keyof AvatarTypes.AvatarData] || 
                         generatedAvatar[property.toLowerCase() as keyof AvatarTypes.AvatarData];

      debug.log({
        message: `Rendering section ${section}`,
        data: {
          hasEditorContent: !!editorContent,
          hasSectionData: !!sectionData,
          rawContent: sectionData
        }
      }, 'renderSectionContent');

      if (!sectionData) {
        debug.warn(`No data available for section: ${section}`, 'renderSectionContent');
        return <p>No data available for this section.</p>;
      }

      // Parse JSON content if needed
      let formattedContent = '';
      try {
        if (typeof sectionData === 'string' && (sectionData.startsWith('{') || sectionData.startsWith('['))) {
          const parsed = JSON.parse(sectionData);
          if (parsed.headline && Array.isArray(parsed.points)) {
            formattedContent = `<h3>${parsed.headline}</h3>\n${parsed.points.map((point: string) => `• ${point}`).join('\n')}`;
          } else {
            formattedContent = typeof sectionData === 'string' ? sectionData : JSON.stringify(sectionData);
          }
        } else if (typeof sectionData === 'object' && sectionData !== null) {
          // Handle AvatarDetails type
          if ('name' in sectionData || 'career' in sectionData) {
            formattedContent = Object.entries(sectionData)
              .filter(([_, value]) => value)
              .map(([key, value]) => `• ${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`)
              .join('\n');
          } else {
            formattedContent = JSON.stringify(sectionData);
          }
        } else {
          formattedContent = String(sectionData);
        }
      } catch (error) {
        debug.error({
          message: `Error parsing section content: ${section}`,
          error,
          content: sectionData
        }, 'renderSectionContent');
        formattedContent = String(sectionData);
      }

      // Update editor contents
      if (formattedContent) {
        setEditorContents(prev => ({
          ...prev,
          [section]: formattedContent
        }));
      }
    }

    const sectionInfo = avatarSections.find(s => s.id === section);
    const sectionTitle = sectionInfo ? `${sectionInfo.icon} ${sectionInfo.title}` : section;

    return (
      <div id={section}>
        <h2 className="text-xl font-bold mb-4">{sectionTitle}</h2>
        <ReactQuill
          theme="snow"
          value={editorContent || ''}
          onChange={(content) => handleEditorChange(content, section)}
          modules={{
            toolbar: [
              [{ 'header': [1, 2, 3, false] }],
              ['bold', 'italic', 'underline', 'strike'],
              [{'list': 'ordered'}, {'list': 'bullet'}],
              ['link', 'image'],
              ['clean']
            ],
          }}
          className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        />
      </div>
    );
  };

  const emojiMap = {
    '[Person]': '👤',
    '[Book]': '📖',
    '[Target]': '🎯',
    '[Pained Face]': '😣',
    '[Sparkles]': '✨',
    '[Trophy]': '🏆',
    '[Exclamation]': '❗',
    '[Downcast Face]': '',
    '[Frustrated Face]': '😤',
    '[Speaking Head]': '🗣️',
    '[Money with Wings]': '💸',
    '[Star]': '⭐',
  };

  // Add this comment to suppress the warning
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function replacePlaceholders(text: string): string {
    return Object.entries(emojiMap).reduce((acc, [placeholder, emoji]) => 
      acc.split(placeholder).join(emoji), text);
  }

  const generatePDF = async () => {
    if (!generatedAvatar) return;

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Helper function to parse and format content
    const formatPDFContent = (content: any): string => {
      try {
        if (typeof content === 'string') {
          // Try to parse JSON string
          if (content.startsWith('{')) {
            const parsed = JSON.parse(content);
            if (parsed.headline && Array.isArray(parsed.points)) {
              return `${parsed.headline}\n${parsed.points.map((point: string) => `• ${point}`).join('\n')}`;
            }
            // Handle personal details
            if (parsed.name || parsed.career) {
              return Object.entries(parsed)
                .filter(([_, value]) => value)
                .map(([key, value]) => `• ${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`)
                .join('\n');
            }
          }
          // If not JSON or parsing fails, return cleaned string
          return content.replace(/<[^>]*>/g, '');
        }
        // Handle object directly
        if (typeof content === 'object' && content !== null) {
          if (content.headline && Array.isArray(content.points)) {
            return `${content.headline}\n${content.points.map((point: string) => `• ${point}`).join('\n')}`;
          }
          if (content.name || content.career) {
            return Object.entries(content)
              .filter(([_, value]) => value)
              .map(([key, value]) => `• ${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`)
              .join('\n');
          }
        }
        return String(content);
      } catch (error) {
        console.error('Error formatting PDF content:', error);
        return String(content);
      }
    };

    // Add title and avatar info
    pdf.setFillColor(128, 0, 128);
    pdf.rect(0, 0, 210, 30, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(24);
    pdf.text('Avatar Profile', 20, 20);

    let yPos = 40;

    // Add avatar image if available
    if (avatarImageUrl) {
      try {
        const img = await loadImage(avatarImageUrl);
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imgData = canvas.toDataURL('image/png');
          pdf.addImage(imgData, 'PNG', 20, yPos, 40, 40);
          yPos += 50;
        }
      } catch (error) {
        console.error('Failed to add image to PDF:', error);
      }
    }

    // Define sections to include in PDF
    const sections = [
      { title: "Personal Details", content: generatedAvatar.details },
      { title: "Story", content: generatedAvatar.story },
      { title: "Current Wants", content: generatedAvatar.current_wants || generatedAvatar.currentWants },
      { title: "Pain Points", content: generatedAvatar.pain_points || generatedAvatar.painPoints },
      { title: "Desires", content: generatedAvatar.desires },
      { title: "Offer Results", content: generatedAvatar.offer_results || generatedAvatar.offerResults },
      { title: "Biggest Problem", content: generatedAvatar.biggest_problem || generatedAvatar.biggestProblem },
      { title: "Humiliation", content: generatedAvatar.humiliation },
      { title: "Frustrations", content: generatedAvatar.frustrations },
      { title: "Complaints", content: generatedAvatar.complaints },
      { title: "Cost of Not Buying", content: generatedAvatar.cost_of_not_buying || generatedAvatar.costOfNotBuying },
      { title: "Biggest Want", content: generatedAvatar.biggest_want || generatedAvatar.biggestWant }
    ];

    // Add each section
    for (const { title, content } of sections) {
      // Check if we need a new page
      if (yPos > 250) {
        pdf.addPage();
        yPos = 20;
      }

      // Add section title
      pdf.setFillColor(240, 240, 250);
      pdf.rect(15, yPos - 5, 180, 10, 'F');
      pdf.setTextColor(0, 0, 128);
      pdf.setFontSize(14);
      pdf.text(title, 20, yPos);
      yPos += 10;

      // Format and add content
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(12);
      const formattedContent = formatPDFContent(content);
      
      // Split content into lines that fit the page width
      const lines = pdf.splitTextToSize(formattedContent, 170);
      
      // Add each line
      for (const line of lines) {
        if (yPos > 270) {
          pdf.addPage();
          yPos = 20;
        }
        pdf.text(line, 20, yPos);
        yPos += 6;
      }

      yPos += 10;
    }

    // Save the PDF
    const fileName = getAvatarName(generatedAvatar).replace(/[^a-zA-Z0-9]/g, '_');
    pdf.save(`${fileName}_profile.pdf`);
  };

  // Helper function to load images
  const loadImage = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = document.createElement('img');
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  };

  const addWithAI = async (section: string) => {
    const toastId = toast.loading(`Generating new content for ${section}...`);

    try {
      setLoading(true);
      
      const response = await fetch('/api/generate-section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          section, 
          avatarData: generatedAvatar 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate new points');
      }

      const newContent = await response.json();

      // Format the content with headline and points
      const formattedContent = `<h3>${newContent.headline}</h3>\n${newContent.points
        .map((point: string) => `• ${point.trim()}`)
        .join('\n')}`;

      // Update the editor contents
      setEditorContents(prev => ({
        ...prev,
        [section]: prev[section] ? 
          `${prev[section]}<br><br>${formattedContent}` : 
          formattedContent
      }));

      // Update the avatar data
      setGeneratedAvatar((prev) => {
        if (!prev) return prev;
        const property = sectionToPropertyMap[section];
        const currentContent = prev[property as keyof AvatarData] || '';
        
        return {
          ...prev,
          [property]: currentContent ? 
            `${currentContent}<br><br>${formattedContent}` : 
            formattedContent,
        };
      });

      toast.success(`Added new points to ${section}`, { id: toastId });
    } catch (error) {
      console.error("Error adding with AI:", error);
      toast.error(`Failed to add new points: ${error instanceof Error ? error.message : "Unknown error"}`, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const slideIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.3 }
  };

  const getAvatarDescription = (avatar: AvatarData | null): string => {
    if (!avatar) return 'Unnamed Avatar';

    // If details is an object
    if (typeof avatar.details === 'object' && avatar.details !== null) {
      return avatar.details.name || 'Unnamed Avatar';
    }

    // If details is a string
    if (typeof avatar.details === 'string') {
      try {
        const parsed = JSON.parse(avatar.details);
        if (parsed && typeof parsed === 'object' && parsed.name) {
          return parsed.name;
        }
      } catch {
        // If not valid JSON, try to extract name using regex
        const detailsString = avatar.details as string;
        const nameMatch = detailsString.match(/name:\s*([^,\n]+)/i);
        if (nameMatch?.[1]) {
          return nameMatch[1].trim();
        }
      }
    }

    // Fallback to avatar name property or default
    return avatar.name || 'Unnamed Avatar';
  };

  // Update the handleSaveAvatar function
  const handleSaveAvatar = async () => {
    if (!user?.id || !generatedAvatar) {
      debug.error('Cannot save avatar: missing user ID or avatar data', 'handleSaveAvatar');
      toast.error('No avatar to save');
      return;
    }

    try {
      debug.log({
        message: 'Starting avatar save process',
        data: {
          userId: user.id,
          avatarId: generatedAvatar.id,
          sections: Object.keys(editorContents)
        }
      }, 'handleSaveAvatar');

      // Map editor contents back to avatar data structure
      const updatedAvatarData = {
        ...generatedAvatar,
        user_id: user.id,
        user_email: user.emailAddresses[0]?.emailAddress || '',
        targetAudience: formData.targetAudience,
        helpDescription: formData.helpDescription,
        imageUrl: avatarImageUrl
      };

      // Map each section's content
      Object.entries(sectionToPropertyMap).forEach(([sectionId, propertyKey]) => {
        const content = editorContents[sectionId];
        debug.log(`Processing section ${sectionId} for save:`, {
          propertyKey,
          hasContent: !!content
        }, 'handleSaveAvatar');
        
        if (content) {
          (updatedAvatarData as any)[propertyKey] = content;
        }
      });

      debug.log({
        message: 'Prepared avatar data for save',
        data: updatedAvatarData
      }, 'handleSaveAvatar');

      let savedAvatar;
      // Always update if we have an ID, otherwise create new
      if (generatedAvatar.id) {
        debug.log({
          message: 'Updating existing avatar',
          id: generatedAvatar.id
        }, 'handleSaveAvatar');
        savedAvatar = await updateAvatar(generatedAvatar.id, updatedAvatarData);
        toast.success('Avatar updated successfully!');
      } else {
        debug.log('Creating new avatar', 'handleSaveAvatar');
        savedAvatar = await saveAvatar(user.id, updatedAvatarData);
        toast.success('Avatar saved successfully!');
      }

      setGeneratedAvatar({ ...savedAvatar });
      debug.log({
        message: 'Avatar saved successfully',
        data: savedAvatar
      }, 'handleSaveAvatar');

      await fetchSavedAvatars();
    } catch (error) {
      debug.error({
        message: 'Error saving avatar',
        error
      }, 'handleSaveAvatar');
      toast.error('Failed to save avatar');
    }
  };

  // Update the useEffect to use debug
  useEffect(() => {
    if (generatedAvatar) {
      const description = getAvatarDescription(generatedAvatar);
      debug.log('Updated avatar description:', description, 'handleSaveAvatar');
    }
  }, [generatedAvatar]);

  const loadSavedAvatar = async (avatar: AvatarData, index: number) => {
    try {
      debug.log({
        message: 'Starting to load avatar',
        data: { 
          id: avatar.id,
          name: avatar.name,
          allFields: Object.keys(avatar)
        }
      }, 'loadSavedAvatar');

      // Helper function to get content from avatar data
      const getAvatarContent = (propertyKey: string): any => {
        // Try different possible field names
        return avatar[propertyKey as keyof AvatarData] || // camelCase
               avatar[propertyKey.toLowerCase() as keyof AvatarData] || // lowercase
               avatar[propertyKey.split(/(?=[A-Z])/).join('_').toLowerCase() as keyof AvatarData] || // snake_case
               avatar.data?.[propertyKey as keyof AvatarData] || // nested in data object
               null;
      };

      // Process each section with verification
      const initialContents: Record<string, string> = {};
      Object.entries(sectionToPropertyMap).forEach(([sectionId, propertyKey]) => {
        const content = getAvatarContent(propertyKey);
        
        debug.log({
          message: `Processing section ${sectionId}`,
          data: {
            propertyKey,
            foundContent: !!content,
            contentType: typeof content,
            possibleKeys: [
              propertyKey,
              propertyKey.toLowerCase(),
              propertyKey.split(/(?=[A-Z])/).join('_').toLowerCase()
            ]
          }
        }, 'loadSavedAvatar');

        if (content) {
          const parsedContent = parseContent(content);
          initialContents[sectionId] = parsedContent;
        } else {
          debug.warn(`No content found for section: ${sectionId}`, 'loadSavedAvatar');
        }
      });

      // Set all the state
      setCurrentAvatarId(index);
      setGeneratedAvatar(avatar);
      setEditorContents(initialContents);
      setAvatarImageUrl(avatar.image_url || avatar.imageUrl || null);
      setFormData({
        targetAudience: avatar.target_audience || avatar.targetAudience || '',
        helpDescription: avatar.help_description || avatar.helpDescription || ''
      });

      // Log final state for verification
      debug.log({
        message: 'Final loaded sections',
        data: {
          totalSections: Object.keys(initialContents).length,
          loadedSections: Object.keys(initialContents),
          missingSectons: Object.keys(sectionToPropertyMap).filter(
            section => !initialContents[section]
          ),
          rawAvatarData: avatar,
          processedContents: initialContents
        }
      }, 'loadSavedAvatar');

      setStep(2);
      toast.success("Avatar loaded successfully!");
    } catch (error) {
      debug.error({
        message: 'Error loading avatar',
        error
      }, 'loadSavedAvatar');
      toast.error('Failed to load avatar');
    }
  };

  // Helper function to check if a string is valid JSON
  const isJsonString = (str: any): boolean => {
    if (typeof str !== 'string') return false;
    try {
      JSON.parse(str);
      return true;
    } catch (e) {
      return false;
    }
  };

  const deleteCurrentAvatar = async () => {
    if (!generatedAvatar?.id || currentAvatarId === null) {
      toast.error('No avatar selected for deletion.');
      return;
    }

    try {
      setLoading(true);
      
      // Delete from Supabase
      await deleteAvatar(generatedAvatar.id);

      // Update local state
      const updatedAvatars = savedAvatars.filter((_, index) => index !== currentAvatarId);
      setSavedAvatars(updatedAvatars);

      if (updatedAvatars.length > 0) {
        // Load the next available avatar
        const nextAvatarIndex = Math.min(currentAvatarId, updatedAvatars.length - 1);
        const nextAvatar = updatedAvatars[nextAvatarIndex];
        
        // Update all relevant states
        setGeneratedAvatar(nextAvatar);
        setCurrentAvatarId(nextAvatarIndex);
        
        // Reset editor contents with the next avatar's data
        const initialContents: Record<string, string> = {};
        Object.entries(sectionToPropertyMap).forEach(([section, property]) => {
          const sectionData = nextAvatar[property as keyof AvatarTypes.AvatarData];
          if (sectionData) {
            initialContents[section] = formatSectionData(sectionData);
          }
        });
        setEditorContents(initialContents);

        // Update form data
        setFormData({
          targetAudience: nextAvatar.targetAudience || '',
          helpDescription: nextAvatar.helpDescription || ''
        });

        // Set avatar image
        setAvatarImageUrl(nextAvatar.imageUrl || null);

        toast.success('Avatar deleted. Loaded next available avatar.');
      } else {
        // No avatars left, reset all states
        setGeneratedAvatar(null);
        setCurrentAvatarId(null);
        setEditorContents({});
        setFormData({
          targetAudience: '',
          helpDescription: ''
        });
        setAvatarImageUrl(null);
        setStep(1);
        toast.success('Avatar deleted. No more avatars available.');
      }
    } catch (error) {
      console.error('Error deleting avatar:', error);
      toast.error('Failed to delete avatar');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadAvatar = () => {
    if (generatedAvatar) {
      const jsonString = JSON.stringify(generatedAvatar, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'avatar_data.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const ThemeToggleButton = () => (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="bg-white text-gray-800 hover:bg-gray-100 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700 border-gray-300 dark:border-gray-600"
    >
      {theme === "light" ? <MoonIcon className="h-5 w-5" /> : <SunIcon className="h-5 w-5" />}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );

  // Update the avatar display in the dropdown
  const getAvatarName = (avatar: AvatarData): string => {
    if (!avatar) {
      return 'Unnamed Avatar';
    }

    // First try to get the name directly from the avatar name field
    if (avatar.name) {
      return avatar.name;
    }

    // If no name field, try to construct it from details
    const details = avatar.details;
    let name = '';
    let career = '';

    if (typeof details === 'object' && details !== null) {
      name = details.name || '';
      career = details.career || details.profession || '';
    } else if (typeof details === 'string') {
      try {
        const parsed = JSON.parse(details);
        name = parsed.name || '';
        career = parsed.career || parsed.profession || '';
      } catch {
        // If parsing fails, try to extract from string using type assertion
        const detailsString = details as string;
        const nameMatch = detailsString.match(/Name:\s*([^•\n,]+)/);
        const careerMatch = detailsString.match(/Career:\s*([^•\n,]+)/);
        
        name = nameMatch?.[1]?.trim() || '';
        career = careerMatch?.[1]?.trim() || '';
      }
    }

    // Clean up and format
    name = name.replace(/[^\w\s-]/g, '').trim();
    career = career.replace(/[^\w\s-]/g, '').trim();

    return name && career ? `${name} - ${career}` : 'Unnamed Avatar';
  };

  const handleSaveConfirm = async () => {
    if (!user?.id || !generatedAvatar) return;

    try {
      setLoading(true);
      
      // Save avatar data to Supabase
      const { data: avatar, error } = await supabase
        .from('avatars')
        .insert([
          {
            user_id: user.id,
            name: avatarName,
            profession: typeof generatedAvatar.details === 'object' 
              ? generatedAvatar.details.profession || generatedAvatar.details.career 
              : undefined,
            niche: typeof generatedAvatar.details === 'object' 
              ? generatedAvatar.details.niche 
              : undefined,
            target_audience: generatedAvatar.targetAudience,
            help_description: generatedAvatar.helpDescription,
            details: generatedAvatar.details,
            story: generatedAvatar.story,
            current_wants: generatedAvatar.currentWants,
            pain_points: generatedAvatar.painPoints,
            desires: generatedAvatar.desires,
            offer_results: generatedAvatar.offerResults,
            biggest_problem: generatedAvatar.biggestProblem,
            humiliation: generatedAvatar.humiliation,
            frustrations: generatedAvatar.frustrations,
            complaints: generatedAvatar.complaints,
            cost_of_not_buying: generatedAvatar.costOfNotBuying,
            biggest_want: generatedAvatar.biggestWant,
            image_url: avatarImageUrl,
            image_generation_keywords: generatedAvatar.imageGenerationKeywords || generatedAvatar.image_generation_keywords
          }
        ])
        .select()
        .single();

      if (error) throw error;

      toast.success('Avatar saved successfully');
      setIsSaveDialogOpen(false);
      setAvatarName('');
    } catch (error) {
      console.error('Error saving avatar:', error);
      toast.error('Failed to save avatar');
    } finally {
      setLoading(false);
    }
  };

  const SaveDialog = () => (
    <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save Avatar</DialogTitle>
          <DialogDescription>
            Give your avatar a name to save it
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Input
              id="avatarName"
              placeholder="Enter avatar name"
              className="col-span-4"
              value={avatarName}
              onChange={(e) => setAvatarName(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsSaveDialogOpen(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveAvatar}
            disabled={!avatarName.trim()}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const SavedAvatarsDropdown = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="bg-white text-gray-800 hover:bg-gray-100 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700 border-gray-300 dark:border-gray-600">
          Load Avatar <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <DropdownMenuLabel className="text-gray-800 dark:text-white">Saved Avatars</DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
        <div className="max-h-[300px] overflow-y-auto">
          {savedAvatars.map((avatar, index) => (
            <DropdownMenuItem 
              key={index}
              onClick={() => loadSavedAvatar(avatar, index)}
              className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
            >
              <div className="flex items-center gap-3 w-full">
                <Avatar className="w-8 h-8 flex-shrink-0">
                  {avatar.imageUrl ? (
                    <div className="w-full h-full rounded-full overflow-hidden">
                      <Image 
                        src={avatar.imageUrl} 
                        alt={getAvatarDescription(avatar)}
                        width={32}
                        height={32}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <AvatarFallback className="bg-gray-200 dark:bg-gray-600 text-xs">
                      AI
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {getAvatarInfo(avatar).name}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {getAvatarInfo(avatar).career}
                  </span>
                </div>
              </div>
            </DropdownMenuItem>
          ))}
          {savedAvatars.length === 0 && (
            <DropdownMenuItem disabled className="text-gray-500 dark:text-gray-400">
              No saved avatars
            </DropdownMenuItem>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const SaveButton = () => (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSaveAvatar}
      className="bg-white dark:bg-gray-800"
    >
      <Save className="mr-2 h-4 w-4" />
      {generatedAvatar?.id ? 'Update Avatar' : 'Save Avatar'}
    </Button>
  );

  // Add this new function near the top of the component
  const fetchSavedAvatars = async () => {
    if (!user?.id) return;
    
    try {
      const { data: avatars, error } = await supabase
        .from('avatars')
        .select('*')
        .eq('clerk_user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching avatars:', error);
        return;
      }

      setSavedAvatars(avatars || []);
    } catch (error) {
      console.error('Error fetching saved avatars:', error);
    }
  };

  // Add useEffect to fetch avatars when component mounts or user changes
  useEffect(() => {
    if (user?.id) {
      fetchSavedAvatars();
    }
  }, [user?.id]);

  // Add this function before loadSavedAvatar
  const parseContent = (content: unknown): string => {
    if (!content) return '';

    // Handle AvatarDetails object (for personal details section)
    if (typeof content === 'object' && content !== null && !Array.isArray(content)) {
      return Object.entries(content as Record<string, unknown>)
        .filter(([_, value]) => value)
        .map(([key, value]) => `• ${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`)
        .join('\n');
    }

    // Handle string content
    if (typeof content === 'string') {
      try {
        // Try to parse if it's a JSON string
        if (content.startsWith('{') || content.startsWith('[')) {
          const parsed = JSON.parse(content) as ParsedContent;
          if (typeof parsed === 'object' && parsed !== null) {
            // If it has headline and points structure (main format)
            if (parsed.headline && Array.isArray(parsed.points)) {
              return `<h3>${parsed.headline}</h3>\n${parsed.points.map((point: string) => `• ${point}`).join('\n')}`;
            }
            // Handle other object formats
            return Object.entries(parsed)
              .filter(([_, value]) => value)
              .map(([key, value]) => {
                if (key === 'headline') return `<h3>${value}</h3>`;
                if (key === 'points' && Array.isArray(value)) {
                  return value.map((point: string) => `• ${point}`).join('\n');
                }
                return `• ${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`;
              })
              .join('\n');
          }
        }
        
        // If content already has HTML formatting, return as is
        if (content.includes('<h3>') || content.includes('<p>')) {
          return content;
        }

        // Format plain text content
        const lines = content.split('\n').map(line => line.trim()).filter(line => line);

        // Check if first line looks like a headline
        if (lines[0] && !lines[0].startsWith('•')) {
          return `<h3>${lines[0]}</h3>\n${lines.slice(1)
            .map(line => line.startsWith('•') ? line : `• ${line}`)
            .join('\n')}`;
        }

        // Otherwise, format as bullet points
        return lines
          .map(line => line.startsWith('•') ? line : `• ${line}`)
          .join('\n');

      } catch (error) {
        // If parsing fails, try to maintain format with headlines and points
        const lines = content.split('\n').map(line => line.trim()).filter(line => line);
        
        // Check if first line looks like a headline
        if (lines[0] && !lines[0].startsWith('•')) {
          return `<h3>${lines[0]}</h3>\n${lines.slice(1)
            .map(line => line.startsWith('•') ? line : `• ${line}`)
            .join('\n')}`;
        }
        
        return lines
          .map(line => line.startsWith('•') ? line : `• ${line}`)
          .join('\n');
      }
    }

    // If content is an array, format it as bullet points
    if (Array.isArray(content)) {
      return content.map(item => `• ${String(item)}`).join('\n');
    }

    return String(content);
  };

  // Add this function before loadSavedAvatar
  const getAvatarInfo = (avatar: AvatarData): { name: string; career: string } => {
    let name = '';
    let career = '';

    // Handle details object
    if (typeof avatar.details === 'object' && avatar.details !== null) {
      name = avatar.details.name || '';
      career = avatar.details.career || avatar.details.profession || '';
    } 
    // Handle string details
    else if (typeof avatar.details === 'string') {
      try {
        const parsed = JSON.parse(avatar.details);
        if (typeof parsed === 'object' && parsed !== null) {
          name = parsed.name || '';
          career = parsed.career || parsed.profession || '';
        }
      } catch {
        // If parsing fails, try to extract using regex
        const detailsString = avatar.details as string;
        const nameMatch = detailsString.match(/Name:\s*([^•\n,]+)/);
        const careerMatch = detailsString.match(/Career:\s*([^•\n,]+)/);
        
        name = nameMatch?.[1]?.trim() || '';
        career = careerMatch?.[1]?.trim() || '';
      }
    }

    return {
      name: name || 'Unnamed Avatar',
      career: career || 'No career specified'
    };
  };

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <Dialog open={showLoadingDialog} onOpenChange={setShowLoadingDialog}>
        <DialogContent className="sm:max-w-md border-0 bg-gradient-to-br from-white/90 to-white/50 dark:from-gray-900/90 dark:to-gray-900/50 backdrop-blur-lg">
          <DialogHeader>
            <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent animate-pulse">
              Generating Avatar
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-300">
              Please wait while we create your custom avatar profile...
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center justify-center p-8 space-y-8">
            <LoadingAnimation />
            
            <div className="space-y-2 text-gray-600 dark:text-gray-300">
              <p className="animate-[fadeIn_1s_ease-in]">
                 Creating personality profile...
              </p>
              <p className="animate-[fadeIn_1s_ease-in_0.5s_both]">
                ✨ Analyzing target audience...
              </p>
              <p className="animate-[fadeIn_1s_ease-in_1s_both]">
                🎯 Crafting unique characteristics...
              </p>
            </div>

            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full mt-4 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-purple-600 to-pink-600 rounded-full animate-[progressBar_2s_ease-in-out_infinite]" />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {isClient ? (
        <>
          {step === 1 ? (
            <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-700 dark:text-white">
              <CardHeader className="pb-0">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400">
                    AI Avatar Magic
                  </CardTitle>
                  <ThemeToggleButton />
                </div>
                <CardDescription className="text-lg mt-1 text-gray-600 dark:text-gray-300">
                  Tell us about your target audience
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={(e) => { e.preventDefault(); handleGenerate(); }} className="space-y-6 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="targetAudience" className="text-gray-700 dark:text-gray-200">Who are you helping?</Label>
                    <Input
                      id="targetAudience"
                      placeholder="E.g., Busy professionals, New parents, Small business owners"
                      value={formData.targetAudience}
                      onChange={(e) => handleInputChange("targetAudience", e.target.value)}
                      className={`bg-white dark:bg-gray-700 text-gray-800 dark:text-white ${errors.targetAudience ? 'border-red-500' : ''}`}
                    />
                    {errors.targetAudience && <p className="text-red-500 text-sm mt-1">{errors.targetAudience}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="helpDescription" className="text-gray-700 dark:text-gray-200">What are you helping them with?</Label>
                    <Textarea
                      id="helpDescription"
                      placeholder="Describe the problem you're solving or the transformation you're offering"
                      value={formData.helpDescription}
                      onChange={(e) => handleInputChange("helpDescription", e.target.value)}
                      rows={4}
                      className={`bg-white dark:bg-gray-700 text-gray-800 dark:text-white ${errors.helpDescription ? 'border-red-500' : ''}`}
                    />
                    {errors.helpDescription && <p className="text-red-500 text-sm mt-1">{errors.helpDescription}</p>}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      onClick={handleGenerate}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 transition-all duration-200"
                      disabled={loading}
                    >
                      Generate Avatar
                    </Button>
                    <Button type="button" variant="outline" onClick={fillExampleData} className="text-gray-800 dark:text-white border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700">
                      Fill Example
                    </Button>
                    <SavedAvatarsDropdown />
                  </div>
                </form>
              </CardContent>
              <CardFooter className="flex justify-center mt-6">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  AI-powered avatar creation • Customizable profiles  Instant generation
                </p>
              </CardFooter>
            </Card>
          ) : (
            <motion.div key="step2" {...slideIn}>
              <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-700 dark:text-white">
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    <div className="relative w-24 h-24">
                      <Avatar className="w-full h-full">
                        {avatarImageUrl ? (
                          <div className="w-full h-full rounded-full overflow-hidden border-4 border-white shadow-lg">
                            <Image 
                              src={avatarImageUrl} 
                              alt={getAvatarDescription(generatedAvatar)} 
                              width={96}
                              height={96}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                console.error('Image failed to load:', e);
                                const target = e.target as HTMLImageElement;
                                target.src = '/placeholder-avatar.png'; // Add a placeholder image
                              }}
                            />
                          </div>
                        ) : (
                          <AvatarFallback className="w-full h-full flex items-center justify-center text-xl">
                            AI
                          </AvatarFallback>
                        )}
                      </Avatar>
                    </div>
                    <div>
                      <CardTitle className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
                        {getAvatarDescription(generatedAvatar)}
                      </CardTitle>
                      <CardDescription className="text-lg mt-1">
                        AI-generated avatar based on your inputs
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex space-x-2 flex-wrap items-center">
                    <SavedAvatarsDropdown />
                    <SaveButton />
                    <Button variant="outline" size="sm" className="bg-white text-gray-800 hover:bg-gray-100 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 border-gray-300 dark:border-gray-500" onClick={generatePDF}>
                      <Download className="mr-2 h-4 w-4" />
                      Download PDF
                    </Button>
                    <Button variant="destructive" size="sm" onClick={deleteCurrentAvatar} className="bg-red-500 text-white hover:bg-red-600 dark:bg-red-700 dark:hover:bg-red-800">
                      <Trash className="mr-2 h-4 w-4" />
                      Delete Avatar
                    </Button>
                    <ThemeToggleButton />
                  </div>
                </CardHeader>
                <CardContent className="mt-6">
                  <Tabs defaultValue="personal-details">
                    <div className="-mt-8 mb-8">
                      <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 bg-white/50 dark:bg-gray-800/50 p-2 rounded-lg">
                        {avatarSections.map((section) => (
                          <TabsTrigger
                            key={section.id}
                            value={section.id}
                            className="px-3 py-1 text-xs sm:text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white data-[state=active]:shadow-sm flex flex-col items-center text-center h-auto"
                          >
                            <span className="text-lg mb-1">{section.icon}</span>
                            <span className="whitespace-normal">{section.title}</span>
                          </TabsTrigger>
                        ))}
                      </TabsList>
                    </div>
                    <div className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-700">
                      {avatarSections.map((section) => (
                        <TabsContent key={section.id} value={section.id}>
                          <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm shadow-lg">
                            <CardContent className="max-h-[50vh] overflow-y-auto p-4">
                              {renderSectionContent(section.id)}
                            </CardContent>
                            <CardFooter className="flex justify-between mt-4">
                              {!sectionsWithoutAddWithAI.has(section.id) && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-800 dark:text-white"
                                  onClick={() => addWithAI(section.id)}
                                >
                                  <Plus className="mr-2 h-4 w-4" />
                                  Add with AI
                                </Button>
                              )}
                            </CardFooter>
                          </Card>
                        </TabsContent>
                      ))}
                    </div>
                  </Tabs>
                </CardContent>
                <CardFooter className="flex justify-center mt-6">
                  <Badge variant="secondary" className="text-sm">
                    AI-powered avatar creation • Customizable sections • Instant PDF download
                  </Badge>
                </CardFooter>
              </Card>
            </motion.div>
          )}
        </>
      ) : null}
      <SaveDialog />
      <SaveDialog />
    </div>
  );
}
