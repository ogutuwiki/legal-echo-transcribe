import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CreditCard, Smartphone, Wallet } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface PaymentMethodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentType: "subscription" | "credits";
  amount?: number;
}

export const PaymentMethodDialog = ({ open, onOpenChange, paymentType, amount = 10 }: PaymentMethodDialogProps) => {
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [isProcessing, setIsProcessing] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const processPayment = useMutation({
    mutationFn: async () => {
      setIsProcessing(true);
      
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      const { error: paymentError } = await supabase
        .from("payments")
        .insert({
          user_id: user?.id,
          amount,
          payment_type: paymentType,
          payment_method: paymentMethod,
          status: "completed",
        });

      if (paymentError) throw paymentError;

      if (paymentType === "credits") {
        const { data: currentCredits } = await supabase
          .from("credits")
          .select("balance")
          .eq("user_id", user?.id)
          .single();

        const newBalance = (currentCredits?.balance || 0) + amount * 60;

        const { error: creditsError } = await supabase
          .from("credits")
          .update({ balance: newBalance })
          .eq("user_id", user?.id);

        if (creditsError) throw creditsError;
      }

      const { error: notifError } = await supabase
        .from("notifications")
        .insert({
          user_id: user?.id,
          type: "payment",
          title: "Payment Successful",
          message: `Your payment of $${amount} was processed successfully.`,
        });

      if (notifError) throw notifError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-credits"] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      toast.success("Payment processed successfully!");
      setIsProcessing(false);
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Payment failed. Please try again.");
      setIsProcessing(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Choose Payment Method</DialogTitle>
          <DialogDescription>
            Select your preferred payment method to complete the transaction
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
            <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-accent">
              <RadioGroupItem value="card" id="card" />
              <Label htmlFor="card" className="flex items-center gap-2 cursor-pointer flex-1">
                <CreditCard className="h-5 w-5" />
                <div>
                  <p className="font-medium">Credit/Debit Card</p>
                  <p className="text-sm text-muted-foreground">Visa, Mastercard, Amex</p>
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-accent">
              <RadioGroupItem value="mobile" id="mobile" />
              <Label htmlFor="mobile" className="flex items-center gap-2 cursor-pointer flex-1">
                <Smartphone className="h-5 w-5" />
                <div>
                  <p className="font-medium">Mobile Money</p>
                  <p className="text-sm text-muted-foreground">M-Pesa, Airtel Money</p>
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-accent">
              <RadioGroupItem value="wallet" id="wallet" />
              <Label htmlFor="wallet" className="flex items-center gap-2 cursor-pointer flex-1">
                <Wallet className="h-5 w-5" />
                <div>
                  <p className="font-medium">Digital Wallet</p>
                  <p className="text-sm text-muted-foreground">PayPal, Stripe</p>
                </div>
              </Label>
            </div>
          </RadioGroup>

          <div className="border-t pt-4">
            <div className="flex justify-between mb-4">
              <span className="font-medium">Total Amount</span>
              <span className="font-bold text-lg">${amount}</span>
            </div>
            <Button 
              className="w-full" 
              onClick={() => processPayment.mutate()}
              disabled={isProcessing}
            >
              {isProcessing ? "Processing..." : "Complete Payment"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
