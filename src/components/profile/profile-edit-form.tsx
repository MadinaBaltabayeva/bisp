"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { profileSchema, type ProfileFormValues, type ProfileFormInput } from "@/lib/validations/user";
import { updateProfile, updateProfilePhoto } from "@/features/auth/actions";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface ProfileEditFormProps {
  user: {
    id: string;
    name: string;
    image: string | null;
    bio: string;
    location: string;
  };
}

export function ProfileEditForm({ user }: ProfileEditFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState(user.image);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<ProfileFormInput, unknown, ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name,
      bio: user.bio || "",
      location: user.location || "",
    },
  });

  const bioValue = form.watch("bio") || "";

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const result = await updateProfilePhoto(formData);
      if (result.error) {
        toast.error(result.error);
      } else if (result.success && result.imageUrl) {
        setAvatarUrl(result.imageUrl);
        toast.success("Profile photo updated");
      }
    } catch {
      toast.error("Failed to upload photo");
    } finally {
      setIsUploadingPhoto(false);
      // Reset file input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  function onSubmit(values: ProfileFormValues) {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("name", values.name);
      formData.append("bio", values.bio || "");
      formData.append("location", values.location || "");

      const result = await updateProfile(formData);
      if (result.error) {
        toast.error(result.error);
      } else if (result.success) {
        toast.success("Profile updated");
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-8">
      {/* Photo Section */}
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-end">
        <div className="relative">
          <Avatar className="size-24 text-2xl">
            <AvatarImage
              src={avatarUrl || undefined}
              alt={user.name}
            />
            <AvatarFallback className="bg-primary-100 text-primary-700 text-2xl">
              {user.name?.charAt(0)?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          {isUploadingPhoto && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
              <Loader2 className="size-6 animate-spin text-white" />
            </div>
          )}
        </div>
        <div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingPhoto}
          >
            <Camera className="size-4" />
            {isUploadingPhoto ? "Uploading..." : "Change Photo"}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handlePhotoChange}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            JPEG, PNG, or WebP. Max 5MB.
          </p>
        </div>
      </div>

      {/* Profile Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Display Name</FormLabel>
                <FormControl>
                  <Input placeholder="Your display name" {...field} />
                </FormControl>
                <FormDescription>
                  This is the name other users will see.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="bio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bio</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Tell others a bit about yourself..."
                    className="min-h-[120px] resize-y"
                    {...field}
                  />
                </FormControl>
                <div className="flex items-center justify-between">
                  <FormDescription>
                    A short description about you.
                  </FormDescription>
                  <span
                    className={`text-xs ${
                      bioValue.length > 500
                        ? "text-destructive"
                        : "text-muted-foreground"
                    }`}
                  >
                    {bioValue.length}/500
                  </span>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. San Francisco, CA" {...field} />
                </FormControl>
                <FormDescription>
                  Helps other users know where you are based.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/profiles/${user.id}`)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
