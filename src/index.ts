// change this only
const inputFileName = "dapps_content.md";

import "source-map-support";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import yaml from "yaml";
import { Generator } from "json-s-generator";

const inputFilePath = path.resolve(__dirname, "../input", inputFileName);
const inputFileContent = fs.readFileSync(inputFilePath, "utf-8");

const data = matter(inputFileContent).data;

const generator = new Generator();
const dataSchema = generator.getSchema(data);

// fs.writeFileSync("debugData.json", JSON.stringify(data, null, 2));
// fs.writeFileSync("debugDataSchema.json", JSON.stringify(dataSchema, null, 2));
// console.dir({ dataSchema, inputFilePath }, { depth: 1000 });

const getPropertiesByWidgetType = (
  type: string,
  nestedObj?: IProperty | IProperty[]
) => {
  if(Array.isArray(nestedObj)) return {}
  const props: { [key: string]: any } = {};
  if (type === "array" && nestedObj?.type! === "string") {
    props.widget = "select";
    props.multiple = true;
    props.options = [];
    props.checkThis = "checkThis";
  }
  return props;
};

interface IProperty {
  type: string;
  properties: { [key: string]: IProperty };
  items?: IProperty | IProperty[];
  [key: string]: any;
}

const run = (propertyValueObj: IProperty |IProperty[] | undefined) => {
  const array1 = [];
  if(Array.isArray(propertyValueObj)) return []
  if (!propertyValueObj?.properties) return [];

  return Object.entries(propertyValueObj?.properties).map(
    ([prop, propValueObj]) => {
      const propValueObj_ = propValueObj;
      if (Array.isArray(propValueObj_.items) && propValueObj_.items.length) {
        propValueObj_.items = propValueObj_.items[0];
      }
      const type = propValueObj_.type;
      const tempObj: { [key: string]: any } = {
        name: prop,
        label: prop,
        widget: type === "array" ? "list" : type,
        ...getPropertiesByWidgetType(type, propValueObj_?.items),
      };
      const fields = run(
        type !== "array" ? propValueObj_ : propValueObj_?.items
      );
      // console.log({ prop, fields })
      if (fields.length) {
        tempObj.fields = fields;
      }
      return tempObj;
    }
  );
};

const generatedSchema = run(dataSchema as unknown as IProperty);

fs.writeFile(
  path.resolve(
    __dirname,
    "../output",
    `${Date.now()}-${inputFileName}-schema.yml`
  ),
  yaml.stringify(generatedSchema),
  function (err) {
    if (err) console.error({ err });
    console.log("created file");
  }
);
