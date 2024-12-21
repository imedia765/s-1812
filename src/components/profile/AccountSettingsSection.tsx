import { useState } from "react";
import { Cog, User, Mail, Phone, MapPin, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NextOfKinSection } from "@/components/registration/NextOfKinSection";
import { SpousesSection } from "@/components/registration/SpousesSection";
import { DependantsSection } from "@/components/registration/DependantsSection";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Icons } from "@/components/ui/icons";
import { useToast } from "@/hooks/use-toast";
import { Member } from "@/components/members/types";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface AccountSettingsSectionProps {
  memberData?: Member;
}

export const AccountSettingsSection = ({ memberData }: AccountSettingsSectionProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    full_name: memberData?.full_name || "",
    address: memberData?.address || "",
    town: memberData?.town || "",
    postcode: memberData?.postcode || "",
    email: memberData?.email || "",
    phone: memberData?.phone || "",
    date_of_birth: memberData?.date_of_birth || "",
    marital_status: memberData?.marital_status || "",
    gender: memberData?.gender || "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGoogleLink = () => {
    toast({
      title: "Google Account Linking",
      description: "This feature will be implemented soon.",
    });
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      console.log("Updating profile with data:", formData);

      const { error } = await supabase
        .from('members')
        .update({
          ...formData,
          profile_updated: true,
          first_time_login: false,
          profile_completed: true,
          updated_at: new Date().toISOString()
        })
        .eq('email', memberData?.email);

      if (error) {
        console.error("Profile update error:", error);
        throw error;
      }

      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });

      // If this was a first-time login, redirect to admin dashboard
      if (memberData?.first_time_login) {
        navigate('/admin');
      }

    } catch (error: any) {
      console.error("Profile update failed:", error);
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Collapsible>
      <CollapsibleTrigger asChild>
        <Button 
          variant="default"
          className="flex items-center gap-2 w-full justify-between bg-primary hover:bg-primary/90"
        >
          <div className="flex items-center gap-2">
            <Cog className="h-4 w-4" />
            <span>Profile Settings</span>
          </div>
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-6 pt-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <User className="h-4 w-4" />
              Full Name
            </label>
            <Input 
              name="full_name"
              value={formData.full_name}
              onChange={handleInputChange}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Address
            </label>
            <Textarea 
              name="address"
              value={formData.address}
              onChange={handleInputChange}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Town</label>
            <Input 
              name="town"
              value={formData.town}
              onChange={handleInputChange}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Post Code</label>
            <Input 
              name="postcode"
              value={formData.postcode}
              onChange={handleInputChange}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email
            </label>
            <Input 
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              type="email"
            />
          </div>
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full h-10 bg-white hover:bg-gray-50 border-2 shadow-sm text-gray-700 font-medium"
              onClick={handleGoogleLink}
            >
              <Icons.google className="mr-2 h-5 w-5" />
              Link Google Account
            </Button>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Mobile No
            </label>
            <Input 
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              type="tel"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Date of Birth
            </label>
            <Input 
              name="date_of_birth"
              value={formData.date_of_birth}
              onChange={handleInputChange}
              type="date"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Marital Status</label>
            <Select 
              value={formData.marital_status}
              onValueChange={(value) => handleSelectChange("marital_status", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Marital Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Single</SelectItem>
                <SelectItem value="married">Married</SelectItem>
                <SelectItem value="divorced">Divorced</SelectItem>
                <SelectItem value="widowed">Widowed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Gender</label>
            <Select 
              value={formData.gender}
              onValueChange={(value) => handleSelectChange("gender", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-6 pt-4">
          <NextOfKinSection />
          <SpousesSection />
          <DependantsSection />
        </div>

        <div className="flex justify-end">
          <Button 
            className="bg-green-500 hover:bg-green-600"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Updating..." : "Update Profile"}
          </Button>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};