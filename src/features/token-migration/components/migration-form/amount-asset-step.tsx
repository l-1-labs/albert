import React, { useMemo } from "react"
import { Field, Form, Formik } from "formik"
import * as Yup from "yup"
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  HStack,
  Input,
  Select,
  Text,
} from "@liftedinit/ui"
import { useBalances } from "features/balances"
import { Big } from "big.js"
import { StepNames, TokenMigrationFormData } from "./types"

interface FormValues {
  assetAmount: Big
  assetSymbol: string
  assetTicker: string
  accountAddress: string
}

interface AmountAssetStepProps {
  nextStep: (nextStep: StepNames) => void
  prevStep: (prevStep: StepNames) => void
  setFormData: (values: any) => void
  formData: TokenMigrationFormData
  initialValues: FormValues
}

export const AmountAssetStep = ({
  nextStep,
  prevStep,
  setFormData,
  formData,
  initialValues,
}: AmountAssetStepProps) => {
  const address =
    formData.accountAddress !== ""
      ? formData.accountAddress
      : formData.userAddress
  const { data: balances } = useBalances({ address })
  const [selectedAsset, setSelectedAsset] = React.useState("")
  const [currentMaxAmount, setCurrentMaxAmount] = React.useState(new Big(0))

  const ownedAssetType = useMemo(() => {
    const assets = new Map()
    balances.ownedAssetsWithBalance.forEach(asset => {
      assets.set(asset.identity, asset.symbol)
    })
    return assets
  }, [balances])

  const maxAmount = useMemo(() => {
    const assets = new Map()
    balances.ownedAssetsWithBalance.forEach(asset => {
      assets.set(asset.identity, Big(asset.balance.toString()).times(1e-9)) // TODO: Get the precision programmatically
    })
    return assets
  }, [balances])

  const AmountAssetStepValidationSchema = Yup.object().shape({
    assetAmount: Yup.string()
      .test(
        "is-amount-in-range",
        "Amount must be greater than 0 and less than or equal to your balance",
        function (value) {
          if (value === undefined) return false
          try {
            const bigValue = Big(value)
            return bigValue.gt(0) && bigValue.lte(currentMaxAmount)
          } catch (error) {
            return false
          }
        },
      )
      .required("Required"),
    assetSymbol: Yup.string().required("Required"),
  })

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={AmountAssetStepValidationSchema}
      onSubmit={values => {
        values.assetTicker = ownedAssetType.get(values.assetSymbol)
        values.assetAmount = new Big(values.assetAmount)
        setFormData(values)
        nextStep(StepNames.DESTINATION_ADDRESS)
      }}
    >
      {({ errors, touched, handleChange, setFieldValue }) => (
        <Form>
          <Box p={4}>
            <Text mb={4}>
              Enter the asset amount and asset type to migrate to the new chain.
            </Text>
            <FormControl
              isInvalid={!!(errors.assetSymbol && touched.assetSymbol)}
            >
              <FormLabel htmlFor="assetTicker">Asset Type</FormLabel>
              <Field
                bgColor="gray.100"
                borderColor={errors?.assetSymbol ? "red.500" : undefined}
                borderWidth={errors?.assetSymbol ? "2px" : undefined}
                fontFamily="monospace"
                fontSize="md"
                rounded="md"
                as={Select}
                id="assetSymbol"
                name="assetSymbol"
                placeholder="Select asset type"
                aria-label={"select-asset-type"}
                data-testid="assetSymbol"
                onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
                  handleChange(event)
                  setSelectedAsset(event.target.value)
                  setCurrentMaxAmount(maxAmount.get(event.target.value))
                }}
              >
                {Array.from(ownedAssetType).map(([address, type], index) => (
                  <option
                    key={index}
                    value={address}
                    disabled={type !== "MFX"}
                    data-testid="symbol-option"
                  >
                    {type}
                  </option>
                ))}
              </Field>
              {errors.assetTicker && touched.assetTicker ? (
                <Text color="red.500" data-testid="error-assetSymbol">
                  {errors.assetTicker}
                </Text>
              ) : null}
            </FormControl>
            <FormControl
              isInvalid={!!(errors.assetAmount && touched.assetAmount)}
            >
              <FormLabel htmlFor="assetAmount">Asset Amount</FormLabel>
              <HStack
                bgColor="gray.100"
                fontFamily="monospace"
                fontSize="md"
                rounded="md"
                px={4}
                py={2}
                borderColor={errors?.assetAmount ? "red.500" : undefined}
                borderWidth={errors?.assetAmount ? "2px" : undefined}
              >
                <Field
                  variant="unstyled"
                  as={Input}
                  id="assetAmount"
                  name="assetAmount"
                  type="string"
                  data-testid="assetAmount"
                  aria-label={"select-asset-amount"}
                />
                <HStack>
                  <Text whiteSpace="nowrap" fontSize="xs">
                    Balance:{" "}
                    {selectedAsset !== "" ? currentMaxAmount.toString() : ""}
                  </Text>
                  <Button
                    variant="link"
                    colorScheme="red"
                    size="xs"
                    onClick={async () => {
                      await setFieldValue("assetAmount", currentMaxAmount)
                    }}
                  >
                    Max
                  </Button>
                </HStack>
              </HStack>
              {errors.assetAmount && touched.assetAmount ? (
                <Text color="red.500" data-testid="error-assetAmount">
                  {errors.assetAmount}
                </Text>
              ) : null}
            </FormControl>

            <Button
              data-testid="back-btn"
              mt={4}
              colorScheme="blue"
              onClick={() => {
                setFormData({ userAddress: "" }) // TODO: Refactor this
                prevStep(
                  initialValues.accountAddress === ""
                    ? StepNames.ADDRESS
                    : StepNames.USER_ADDRESS,
                )
              }}
            >
              Back
            </Button>
            <Button
              mt={4}
              ml={2}
              colorScheme="blue"
              type="submit"
              data-testid="next-btn"
            >
              Next
            </Button>
          </Box>
        </Form>
      )}
    </Formik>
  )
}
