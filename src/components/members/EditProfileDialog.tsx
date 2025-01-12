import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Member } from "@/types/member";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const countries = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", 
  "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", 
  "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia", 
  "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica", 
  "Croatia", "Cuba", "Cyprus", "Czech Republic", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt", 
  "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France", "Gabon", 
  "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", 
  "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Jamaica", "Japan", 
  "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Korea, North", "Korea, South", "Kosovo", "Kuwait", "Kyrgyzstan", "Laos", 
  "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar", "Malawi", 
  "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", 
  "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands", 
  "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Macedonia", "Norway", "Oman", "Pakistan", "Palau", "Palestine", 
  "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia", 
  "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", 
  "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", 
  "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", 
  "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", 
  "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", 
  "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam", 
  "Yemen", "Zambia", "Zimbabwe"
];

interface EditProfileDialogProps {
  member: Member;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProfileUpdated: () => void;
}

const EditProfileDialog = ({ member, open, onOpenChange, onProfileUpdated }: EditProfileDialogProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    email: member.email || '',
    phone: member.phone || '',
    address: member.address || '',
    town: member.town || '',
    postcode: member.postcode || '',
    membership_type: member.membership_type || '',
    status: member.status || '',
    collector: member.collector || '',
    date_of_birth: member.date_of_birth || '',
    country_of_birth: member.country_of_birth || ''
  });

  const [openCountry, setOpenCountry] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [selectedCountry, setSelectedCountry] = useState(member.country_of_birth || "");

  const filteredCountries = countries.filter((country) =>
    country.toLowerCase().includes(searchValue.toLowerCase())
  );

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('members')
        .update(formData)
        .eq('id', member.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      onProfileUpdated();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-dashboard-card border-dashboard-accent1/20">
        <DialogHeader>
          <DialogTitle className="text-white text-xl">Edit Profile</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right text-dashboard-text">
              Email
            </Label>
            <Input
              id="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="col-span-3 bg-dashboard-dark text-white border-dashboard-accent1/20"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="phone" className="text-right text-dashboard-text">
              Phone
            </Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              className="col-span-3 bg-dashboard-dark text-white border-dashboard-accent1/20"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="date_of_birth" className="text-right text-dashboard-text">
              Date of Birth
            </Label>
            <Input
              id="date_of_birth"
              type="date"
              value={formData.date_of_birth}
              onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
              className="col-span-3 bg-dashboard-dark text-white border-dashboard-accent1/20"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="country_of_birth" className="text-right text-dashboard-text">
              Country of Birth
            </Label>
            <Popover open={openCountry} onOpenChange={setOpenCountry}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openCountry}
                  className="col-span-3 justify-between bg-dashboard-dark text-white border-dashboard-accent1/20"
                >
                  {selectedCountry || "Select country..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0 bg-dashboard-dark text-white">
                <Command>
                  <CommandInput 
                    placeholder="Search country..." 
                    value={searchValue}
                    onValueChange={setSearchValue}
                  />
                  <CommandEmpty>No country found.</CommandEmpty>
                  <CommandGroup>
                    {filteredCountries.map((country) => (
                      <CommandItem
                        key={country}
                        value={country}
                        onSelect={(currentValue) => {
                          setSelectedCountry(currentValue);
                          setFormData({ ...formData, country_of_birth: currentValue });
                          setOpenCountry(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedCountry === country ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {country}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="address" className="text-right text-dashboard-text">
              Address
            </Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              className="col-span-3 bg-dashboard-dark text-white border-dashboard-accent1/20"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="town" className="text-right text-dashboard-text">
              Town
            </Label>
            <Input
              id="town"
              value={formData.town}
              onChange={(e) => setFormData({...formData, town: e.target.value})}
              className="col-span-3 bg-dashboard-dark text-white border-dashboard-accent1/20"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="postcode" className="text-right text-dashboard-text">
              Postcode
            </Label>
            <Input
              id="postcode"
              value={formData.postcode}
              onChange={(e) => setFormData({...formData, postcode: e.target.value})}
              className="col-span-3 bg-dashboard-dark text-white border-dashboard-accent1/20"
            />
          </div>

          {/* Read-only fields with purple styling */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="membership_type" className="text-right text-dashboard-text">
              Membership Type
            </Label>
            <div className="col-span-3 px-3 py-2 rounded-md bg-dashboard-accent1/10 text-dashboard-accent1 border border-dashboard-accent1/20">
              {member.membership_type || 'Not Set'}
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="text-right text-dashboard-text">
              Status
            </Label>
            <div className="col-span-3 px-3 py-2 rounded-md bg-dashboard-accent1/10 text-dashboard-accent1 border border-dashboard-accent1/20">
              {member.status || 'Not Set'}
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="collector" className="text-right text-dashboard-text">
              Collector
            </Label>
            <div className="col-span-3 px-3 py-2 rounded-md bg-dashboard-accent1/10 text-dashboard-accent1 border border-dashboard-accent1/20">
              {member.collector || 'Not Assigned'}
            </div>
          </div>

          {/* Member number display */}
          <div className="mt-4 text-center border-t border-dashboard-accent1/20 pt-4">
            <div className="text-sm text-dashboard-muted">Member Number</div>
            <div className="text-2xl font-semibold text-dashboard-accent2">
              {member.member_number}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="bg-dashboard-dark text-dashboard-text hover:bg-dashboard-card hover:text-white"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            className="bg-dashboard-accent1 text-white hover:bg-dashboard-accent1/80"
          >
            Save changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditProfileDialog;