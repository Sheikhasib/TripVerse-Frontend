import type { ReactNode } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type TAuthCardProps = {
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
}

const AuthCard = ({ title, description, children, footer }: TAuthCardProps) => {
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
      {footer ? (
        <CardFooter className="justify-center text-sm">{footer}</CardFooter>
      ) : null}
    </Card>
  )
}

export { AuthCard }
